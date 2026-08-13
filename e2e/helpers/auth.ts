import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export function requireTestCredentials(): { email: string; password: string } {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "E2E_TEST_EMAIL e E2E_TEST_PASSWORD precisam estar definidos no .env.local. " +
        "Rode `npm run test:e2e:setup-user` para criar a conta de teste e obter essas credenciais."
    );
  }
  return { email, password };
}

export async function loginAsTestUser(page: Page) {
  const { email, password } = requireTestCredentials();
  await page.goto("/login");
  await page.getByPlaceholder("voce@email.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(dashboard|cursos)/, { timeout: 20_000 });
}

export interface E2ETestData {
  courseId: string;
  courseSlug: string;
  lessonId: string | null;
}

/** Lê os dados gravados por e2e/create-test-user.mjs (curso/aula matriculados para a conta de teste). */
export function requireTestData(): E2ETestData {
  const file = path.resolve(__dirname, "..", ".auth", "test-data.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      "e2e/.auth/test-data.json não encontrado. Rode `npm run test:e2e:setup-user` antes dos testes."
    );
  }
  return JSON.parse(fs.readFileSync(file, "utf-8")) as E2ETestData;
}
