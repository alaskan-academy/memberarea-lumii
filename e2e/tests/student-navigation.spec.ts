import { test, expect } from "../fixtures";

test.describe("Navegação da aluna", () => {
  test("dashboard carrega", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("lista de cursos carrega", async ({ page }) => {
    await page.goto("/cursos");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("fórum carrega", async ({ page }) => {
    await page.goto("/comunidade/forum");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("sino de notificações responde ao clique", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Notificações" }).click();
    // não deve navegar nem quebrar a página — só abre um painel local
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("rota inexistente não quebra com 500", async ({ page }) => {
    const res = await page.goto("/essa-rota-nao-existe-e2e-teste");
    expect(res?.status()).toBeLessThan(500);
  });
});
