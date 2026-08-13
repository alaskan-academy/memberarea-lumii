import { test, expect } from "../fixtures";

test.describe("Verificação de certificado", () => {
  test("hash inexistente retorna 404", async ({ page }) => {
    const res = await page.goto("/verificar/hash-que-nao-existe-e2e-teste");
    expect(res?.status()).toBe(404);
  });

  test("hash com formato inesperado não derruba o servidor", async ({ page }) => {
    const res = await page.goto("/verificar/" + encodeURIComponent("' OR 1=1--"));
    expect(res?.status()).toBeLessThan(500);
  });

  test("sem sessão, a rota exige login antes de mostrar qualquer certificado", async ({ browser }) => {
    // Context isolado, sem storageState — não mexe na sessão compartilhada
    // usada pelos outros testes (ver e2e/fixtures.ts). storageState precisa
    // ser sobrescrito explicitamente: o default global do playwright.config.ts
    // (a sessão autenticada) se aplica a QUALQUER novo context, mesmo criado
    // manualmente aqui, a menos que seja explicitamente zerado.
    const freshContext = await browser.newContext({ storageState: undefined });
    const freshPage = await freshContext.newPage();
    await freshPage.goto("/verificar/qualquer-hash-de-teste");
    await expect(freshPage).toHaveURL(/\/login/);
    await freshContext.close();
  });
});
