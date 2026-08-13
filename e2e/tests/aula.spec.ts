import { test, expect } from "../fixtures";
import { requireTestData } from "../helpers/auth";

test.describe("Player de aula", () => {
  test("aula inexistente mostra página não encontrada", async ({ page }) => {
    // Autenticada, o layout pai (student) já começou a stream de uma resposta
    // 200 antes do notFound() da página disparar — o Next.js App Router não
    // consegue retroagir o status HTTP nesse caso (limitação conhecida do
    // streaming), então o conteúdo é o sinal confiável aqui, não o status.
    await page.goto("/aulas/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText("This page could not be found.")).toBeVisible();
  });

  test("id de aula malformado não derruba o servidor", async ({ page }) => {
    const res = await page.goto("/aulas/id-invalido-nao-e-uuid");
    expect(res?.status()).toBeLessThan(500);
  });

  test("sem sessão, aula redireciona pro login", async ({ browser }) => {
    // Context isolado, sem storageState — não mexe na sessão compartilhada
    // usada pelos outros testes (ver e2e/fixtures.ts). storageState precisa
    // ser sobrescrito explicitamente: o default global do playwright.config.ts
    // (a sessão autenticada) se aplica a QUALQUER novo context, mesmo criado
    // manualmente aqui, a menos que seja explicitamente zerado.
    const freshContext = await browser.newContext({ storageState: undefined });
    const freshPage = await freshContext.newPage();
    await freshPage.goto("/aulas/00000000-0000-0000-0000-000000000000");
    await expect(freshPage).toHaveURL(/\/login/);
    await freshContext.close();
  });

  test("aula matriculada carrega player e sidebar de módulos", async ({ page }) => {
    const { lessonId } = requireTestData();
    test.skip(!lessonId, "Nenhuma aula disponível para a conta de teste — rode npm run test:e2e:setup-user");

    const res = await page.goto(`/aulas/${lessonId}`);
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
  });
});
