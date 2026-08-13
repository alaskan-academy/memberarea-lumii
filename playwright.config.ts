import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e/tests",
  timeout: 45_000,
  // Serial, um worker só: todos os testes reutilizam a MESMA conta/sessão real
  // do Supabase. Rodar em paralelo faz múltiplos contexts tentarem renovar o
  // mesmo refresh_token ao mesmo tempo — o Supabase detecta isso como reuso e
  // revoga a família inteira da sessão, quebrando todo teste depois (erro
  // "session_not_found" / redirect loop entre /login e a rota protegida).
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }]],
  globalSetup: require.resolve("./e2e/global-setup"),
  use: {
    baseURL,
    trace: "on-first-retry",
    // Evita que o service worker do PWA interfira em navegação/cache durante os testes.
    serviceWorkers: "block",
    // Login feito uma vez no global-setup — todo teste já começa autenticado.
    // Testes que precisam simular "sem sessão" limpam cookies/localStorage no próprio teste.
    storageState: "e2e/.auth/session.json",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
