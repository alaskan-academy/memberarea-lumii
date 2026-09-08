import crypto from "crypto";
import { z } from "zod";

// ── Schemas ───────────────────────────────────────────────────────────────────

const PaytProductItemSchema = z.object({
  code: z.string(),
  type: z.string().optional().default("digital"),
  name: z.string().optional().default(""),
  sku: z.string().optional(),
  price: z.number().optional(),     // centavos
  quantity: z.number().optional(),
});

const PaytOrderBumpSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  product: PaytProductItemSchema.extend({
    items: z.array(PaytProductItemSchema).optional().default([]),
  }),
});

const PaytTransactionSchema = z.object({
  payment_method: z.string().optional(),
  payment_status: z.string().optional(),
  total_price: z.number().optional(),   // centavos
  quantity: z.number().optional(),
  modifiers: z.array(z.object({
    name: z.string().optional(),
    reason: z.string().optional(),
    method: z.string().optional(),
    amount: z.number().optional(),
  })).optional().default([]),
  installments: z.number().optional(),
  installment_price: z.number().optional(),
  price_without_installments: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  paid_at: z.string().optional(),
  expires_at: z.string().optional(),
  pix_url: z.string().optional(),
  pix_code: z.string().optional(),
  bankslip_url: z.string().optional(),
  bankslip_code: z.string().optional(),
});

const PaytCommissionSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  type: z.string().optional(),          // "platform" | "producer" | "affiliation"
  amount: z.number().optional(),        // centavos
});

export const PaytPayloadSchema = z.object({
  integration_key: z.string(),
  status: z.string(),                   // "paid" | "refunded" | "canceled" | "chargeback" | "expired" | ...
  transaction_id: z.string(),
  test: z.boolean().optional().default(false),
  type: z.string().optional(),
  tangible: z.boolean().optional(),
  seller_id: z.string().optional(),
  cart_id: z.string().optional(),
  started_at: z.string().optional(),
  updated_at: z.string().optional(),
  customer: z.object({
    email: z.string().email(),
    name: z.string().optional().default(""),
    doc: z.string().optional(),         // CPF (11 dígitos) ou CNPJ
    phone: z.string().optional(),
    ip: z.string().optional(),
    fake_email: z.boolean().optional(),
    url: z.string().optional(),
    code: z.string().optional(),
    billing_address: z.object({
      zipcode: z.string().optional(),
      street: z.string().optional(),
      street_number: z.string().optional(),
      complement: z.string().optional(),
      district: z.string().optional(),
      city: z.string().optional(),
      estate: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }),
  product: z.object({
    code: z.string(),
    type: z.string().optional().default("digital"),
    name: z.string().optional().default(""),
    sku: z.string().optional(),
    price: z.number().optional(),       // centavos
    quantity: z.number().optional(),
    items: z.array(PaytProductItemSchema).optional().default([]),
  }),
  order_bumps: z.array(PaytOrderBumpSchema).optional().default([]),
  transaction: PaytTransactionSchema.optional(),
  commission: z.array(PaytCommissionSchema).optional().default([]),
});

export type PaytPayload = z.infer<typeof PaytPayloadSchema>;

// ── Extração de valores financeiros ──────────────────────────────────────────

/** Retorna total pago e valor recebido pelo produtor (em reais, 2 casas decimais). */
export function extractAmounts(payload: PaytPayload): {
  total: number | null;
  producer: number | null;
  platform: number | null;
  payment_method: string | null;
} {
  const tx = payload.transaction;
  const total = tx?.total_price != null ? tx.total_price / 100 : null;
  const producer = payload.commission?.find((c) => c.type === "producer")?.amount;
  const platform = payload.commission?.find((c) => c.type === "platform")?.amount;
  return {
    total,
    producer: producer != null ? producer / 100 : null,
    platform: platform != null ? platform / 100 : null,
    payment_method: tx?.payment_method ?? null,
  };
}

// ── Autenticação por integration_key ─────────────────────────────────────────

/**
 * Separa a env var em uma lista de chaves aceitas.
 * Cada conta Payt gera a PRÓPRIA "Chave Única" no painel dela — não dá pra
 * escolher o valor. Como a Lumii recebe postbacks de mais de uma empresa
 * (CNPJs diferentes = contas Payt diferentes), PAYT_WEBHOOK_SECRET aceita
 * várias chaves separadas por vírgula, espaço ou quebra de linha.
 * Uma única chave continua funcionando sem mudança nenhuma.
 */
export function parsePaytSecrets(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean))];
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Payt usa postbacks simples (sem header de assinatura).
 * A autenticação é feita comparando o integration_key do payload
 * com as chaves configuradas em PAYT_WEBHOOK_SECRET.
 * Usa timingSafeEqual para prevenir timing attacks.
 *
 * Aceita string (uma ou várias chaves) ou array já separado.
 */
export function verifyPaytIntegrationKey(
  secrets: string | string[] | undefined | null,
  integrationKey: string
): boolean {
  if (!integrationKey) return false;
  const list = Array.isArray(secrets) ? secrets : parsePaytSecrets(secrets);
  if (list.length === 0) return false;

  // Percorre a lista inteira sem short-circuit: sair no primeiro acerto
  // deixaria o tempo de resposta revelar QUAL das contas bateu.
  let matched = false;
  for (const secret of list) {
    if (safeEqual(secret, integrationKey)) matched = true;
  }
  return matched;
}

// ── Extração de product codes ─────────────────────────────────────────────────

/**
 * Retorna todos os product codes presentes na compra:
 * - Produto agrupado (grouped): usa os codes de cada item individual
 * - Produto simples: usa o code do produto
 * - Order bumps: adiciona o code de cada OB (idem, agrupado → itens)
 */
export function extractProductCodes(payload: PaytPayload): string[] {
  const codes: string[] = [];

  if (payload.product.type === "grouped" && payload.product.items.length > 0) {
    for (const item of payload.product.items) {
      if (item.code) codes.push(item.code);
    }
  } else {
    codes.push(payload.product.code);
  }

  for (const bump of payload.order_bumps) {
    if (bump.product?.type === "grouped" && bump.product.items?.length) {
      for (const item of bump.product.items) {
        if (item.code) codes.push(item.code);
      }
    } else if (bump.product?.code) {
      codes.push(bump.product.code);
    }
  }

  return [...new Set(codes)];
}

// ── Classificação de status ───────────────────────────────────────────────────

const GRANT_STATUSES = new Set(["paid", "approved", "completed", "confirmed"]);
// Estornos inequívocos: sempre revogam acesso.
const REVOKE_STATUSES = new Set(["refunded", "chargeback"]);
// "canceled"/"cancelled" é AMBÍGUO na Payt — o status sozinho NÃO decide:
//   • reembolso de pedido pago    → status "canceled" + transaction.payment_status "refunded"        → REVOGAR
//   • PIX/boleto abandonado/expirado → status "canceled" + payment_status "expired"/"waiting_payment" → IGNORAR
// Confirmado em produção: uma aluna gerou vários PIX do MESMO curso que depois
// pagou; os PIX abandonados expiraram como "canceled". Revogar pelo status
// sozinho cortaria o acesso legítimo dela. Por isso exigimos payment_status.
const CANCEL_STATUSES = new Set(["canceled", "cancelled"]);

export function classifyEvent(
  status: string,
  paymentStatus?: string | null
): "grant" | "revoke" | "ignore" {
  if (GRANT_STATUSES.has(status)) return "grant";
  if (REVOKE_STATUSES.has(status)) return "revoke";
  // cancelamento só revoga quando é reembolso de um pagamento efetivado
  if (CANCEL_STATUSES.has(status)) {
    return paymentStatus === "refunded" ? "revoke" : "ignore";
  }
  return "ignore";
}
