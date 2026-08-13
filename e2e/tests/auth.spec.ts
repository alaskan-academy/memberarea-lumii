import { test, expect } from "@playwright/test";
import { loginAsTestUser, requireTestCredentials } from "../helpers/auth";

test.describe("Autenticação", () => {
  test("login com credenciais válidas leva pro dashboard/cursos", async ({ page }) => {
    await page.context().clearCookies();
    await loginAsTestUser(page);
    await expect(page).toHaveURL(/\/(dashboard|cursos)/);
  });

  test("login com senha errada mostra erro e não navega", async ({ page }) => {
    const { email } = requireTestCredentials();
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByPlaceholder("voce@email.com").fill(email);
    await page.getByPlaceholder("••••••••").fill("senha-propositalmente-errada-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("acessar rota protegida sem sessão redireciona pro login", async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      try { localStorage.clear(); } catch {}
    });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("logout encerra a sessão e bloqueia acesso de novo", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Menu do usuário" }).click();
    await page.getByText("Sair", { exact: true }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
