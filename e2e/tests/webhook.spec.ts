import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// A Payt não assina o payload — a autenticação é por integration_key comparado
// via timingSafeEqual contra PAYT_WEBHOOK_SECRET (ver src/lib/payments/payt.ts).
// Estes testes cobrem a validação de chave e de payload, não uma assinatura HMAC.

const WEBHOOK_URL = "/api/webhooks/payt";
const TEST_TXN_PREFIX = "e2e-webhook-test-";

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    integration_key: process.env.PAYT_WEBHOOK_SECRET,
    status: "paid",
    transaction_id: `${TEST_TXN_PREFIX}${Date.now()}`,
    test: true,
    customer: { email: "e2e-webhook-test@example.com", name: "Teste E2E Webhook" },
    product: { code: "CODIGO-INEXISTENTE-E2E-TESTE", type: "digital" },
    ...overrides,
  };
}

test.describe("Webhook Payt", () => {
  test("rejeita integration_key inválida com 401", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: basePayload({ integration_key: "chave-completamente-errada" }),
    });
    expect(res.status()).toBe(401);
  });

  test("rejeita payload sem campos obrigatórios com 400", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: { integration_key: process.env.PAYT_WEBHOOK_SECRET },
    });
    expect(res.status()).toBe(400);
  });

  test("aceita payload válido com product_code desconhecido — ack sem processar", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, { data: basePayload() });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });

  test("status desconhecido é ignorado com 200, sem erro", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: basePayload({ status: "pending" }),
    });
    expect(res.status()).toBe(200);
  });

  test("GET não é permitido (405)", async ({ request }) => {
    const res = await request.get(WEBHOOK_URL);
    expect(res.status()).toBe(405);
  });

  // Limpa os payment_events de teste criados acima — evita acumular lixo no banco
  // a cada execução da suíte.
  test.afterAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return;
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    await supabase
      .from("payment_events")
      .delete()
      .ilike("payload->>transaction_id", `${TEST_TXN_PREFIX}%`);
  });
});
