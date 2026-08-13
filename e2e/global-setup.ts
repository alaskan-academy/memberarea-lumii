import { chromium, type FullConfig } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { loginAsTestUser } from "./helpers/auth";

// Faz login uma única vez via UI real e salva a sessão em e2e/.auth/session.json.
// Todo teste reaproveita essa sessão (configurado em playwright.config.ts via
// use.storageState) — evita logar de novo em cada teste/arquivo.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  const authDir = path.resolve(__dirname, ".auth");
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await loginAsTestUser(page);
  await context.storageState({ path: path.resolve(authDir, "session.json") });

  await browser.close();
}
