import { describe, it, expect } from "vitest";
import {
  parsePaytSecrets,
  verifyPaytIntegrationKey,
  extractProductCodes,
  classifyEvent,
  PaytPayloadSchema,
  type PaytPayload,
} from "./payt";

// ── Helper ────────────────────────────────────────────────────────────────────
// Monta um PaytPayload válido a partir de um objeto parcial, passando pelo schema
// para que os defaults (items: [], order_bumps: [], etc.) sejam preenchidos como
// no fluxo real do webhook.
function makePayload(overrides: Record<string, unknown> = {}): PaytPayload {
  return PaytPayloadSchema.parse({
    integration_key: "key-teste",
    status: "paid",
    transaction_id: "TX1",
    customer: { email: "aluna@example.com", name: "Aluna Teste" },
    product: { code: "SIMPLES1", type: "digital", name: "Curso Simples" },
    ...overrides,
  });
}

// ── parsePaytSecrets ───────────────────────────────────────────────────────────

describe("parsePaytSecrets", () => {
  it("separa chaves por vírgula", () => {
    expect(parsePaytSecrets("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("separa chaves por espaço e quebra de linha", () => {
    expect(parsePaytSecrets("a b\nc")).toEqual(["a", "b", "c"]);
  });

  it("separa por combinação de vírgula e espaço", () => {
    expect(parsePaytSecrets("a, b , c")).toEqual(["a", "b", "c"]);
  });

  it("remove entradas vazias", () => {
    expect(parsePaytSecrets("a,,b, ,c")).toEqual(["a", "b", "c"]);
  });

  it("remove duplicados preservando a primeira ocorrência", () => {
    expect(parsePaytSecrets("a,b,a,c,b")).toEqual(["a", "b", "c"]);
  });

  it("retorna array vazio para undefined, null ou string vazia", () => {
    expect(parsePaytSecrets(undefined)).toEqual([]);
    expect(parsePaytSecrets(null)).toEqual([]);
    expect(parsePaytSecrets("")).toEqual([]);
  });
});

// ── verifyPaytIntegrationKey ────────────────────────────────────────────────────

describe("verifyPaytIntegrationKey", () => {
  it("aceita a chave única correta", () => {
    expect(verifyPaytIntegrationKey("chave-secreta", "chave-secreta")).toBe(true);
  });

  it("rejeita a chave errada", () => {
    expect(verifyPaytIntegrationKey("chave-secreta", "chave-errada")).toBe(false);
  });

  it("aceita qualquer uma de várias chaves separadas por vírgula", () => {
    const secrets = "chave-empresa-A,chave-empresa-B,chave-empresa-C";
    expect(verifyPaytIntegrationKey(secrets, "chave-empresa-A")).toBe(true);
    expect(verifyPaytIntegrationKey(secrets, "chave-empresa-B")).toBe(true);
    expect(verifyPaytIntegrationKey(secrets, "chave-empresa-C")).toBe(true);
  });

  it("aceita chave presente quando recebe um array já separado", () => {
    expect(verifyPaytIntegrationKey(["chave-A", "chave-B"], "chave-B")).toBe(true);
  });

  it("rejeita chave desconhecida mesmo com várias configuradas", () => {
    expect(
      verifyPaytIntegrationKey("chave-A,chave-B", "chave-desconhecida")
    ).toBe(false);
  });

  it("rejeita integration_key vazia", () => {
    expect(verifyPaytIntegrationKey("chave-A", "")).toBe(false);
  });

  it("trata secrets undefined/null como sem chaves configuradas", () => {
    expect(verifyPaytIntegrationKey(undefined, "qualquer")).toBe(false);
    expect(verifyPaytIntegrationKey(null, "qualquer")).toBe(false);
    expect(verifyPaytIntegrationKey("", "qualquer")).toBe(false);
  });
});

// ── extractProductCodes ─────────────────────────────────────────────────────────

describe("extractProductCodes", () => {
  it("produto simples: usa o code do produto", () => {
    const payload = makePayload({
      product: { code: "SIMPLES1", type: "digital", name: "Curso" },
    });
    expect(extractProductCodes(payload)).toEqual(["SIMPLES1"]);
  });

  it("produto agrupado: usa os codes dos itens (não o code do grupo)", () => {
    const payload = makePayload({
      product: {
        code: "GRUPO1",
        type: "grouped",
        name: "Produto Agrupado",
        items: [
          { code: "R28BKV", type: "digital", name: "Produto Digital" },
          { code: "45PK73", type: "physical", name: "Produto Fisico" },
        ],
      },
    });
    expect(extractProductCodes(payload)).toEqual(["R28BKV", "45PK73"]);
  });

  it("order bumps: adiciona o code de cada bump.product", () => {
    const payload = makePayload({
      product: { code: "PRINCIPAL", type: "digital", name: "Curso" },
      order_bumps: [
        { code: "OB1", name: "Order Bump 1", product: { code: "EBOOK1", type: "digital", name: "Ebook 1" } },
        { code: "OB2", name: "Order Bump 2", product: { code: "EBOOK2", type: "digital", name: "Ebook 2" } },
      ],
    });
    expect(extractProductCodes(payload)).toEqual(["PRINCIPAL", "EBOOK1", "EBOOK2"]);
  });

  it("combina produto agrupado + order bumps", () => {
    const payload = makePayload({
      product: {
        code: "GRUPO1",
        type: "grouped",
        name: "Agrupado",
        items: [
          { code: "ITEM1", type: "digital", name: "Item 1" },
          { code: "ITEM2", type: "digital", name: "Item 2" },
        ],
      },
      order_bumps: [
        { code: "OB1", name: "Bump", product: { code: "BUMP1", type: "digital", name: "Bump 1" } },
      ],
    });
    expect(extractProductCodes(payload)).toEqual(["ITEM1", "ITEM2", "BUMP1"]);
  });

  it("deduplica codes repetidos entre produto e order bumps", () => {
    const payload = makePayload({
      product: { code: "REPETIDO", type: "digital", name: "Curso" },
      order_bumps: [
        { code: "OB1", name: "Bump", product: { code: "REPETIDO", type: "digital", name: "Mesmo code" } },
      ],
    });
    expect(extractProductCodes(payload)).toEqual(["REPETIDO"]);
  });
});

// ── classifyEvent ───────────────────────────────────────────────────────────────

describe("classifyEvent", () => {
  it("status 'paid' libera acesso (grant)", () => {
    expect(classifyEvent("paid")).toBe("grant");
  });

  it("estornos revogam acesso (revoke)", () => {
    expect(classifyEvent("refunded")).toBe("revoke");
    expect(classifyEvent("chargeback")).toBe("revoke");
    // reembolso de pedido pago chega como "canceled" + payment_status "refunded"
    expect(classifyEvent("canceled", "refunded")).toBe("revoke");
    expect(classifyEvent("cancelled", "refunded")).toBe("revoke");
  });

  it("estados sem pagamento efetivado são ignorados (ignore)", () => {
    expect(classifyEvent("waiting_payment")).toBe("ignore");
    expect(classifyEvent("expired")).toBe("ignore");
    expect(classifyEvent("refund_requested")).toBe("ignore");
  });

  it('"canceled" só revoga com payment_status "refunded" (não revoga PIX abandonado)', () => {
    // regressão real: PIX abandonado do mesmo curso que a aluna PAGOU expira
    // como "canceled" + payment_status "expired" — revogar aqui cortaria acesso legítimo
    expect(classifyEvent("canceled", "expired")).toBe("ignore");
    expect(classifyEvent("canceled", "waiting_payment")).toBe("ignore");
    expect(classifyEvent("canceled")).toBe("ignore");
    expect(classifyEvent("cancelled", "expired")).toBe("ignore");
  });
});
