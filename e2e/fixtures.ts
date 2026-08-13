import { test as base, type BrowserContext, type Page } from "@playwright/test";
import path from "node:path";

// Um único context/page vivo, reaproveitado por todo o worker (workers: 1 no
// playwright.config.ts, então isso cobre a suíte inteira). Diferente de
// carregar `storageState` fresco em cada teste, um context vivo tem os
// cookies atualizados automaticamente pelo navegador sempre que o servidor
// manda Set-Cookie — igual uma aba de navegador real. Isso evita reaproveitar
// um snapshot de disco desatualizado depois que QUALQUER requisição já rodou
// o refresh do token (o que faria os testes seguintes reutilizarem um
// refresh_token já usado — o Supabase detecta isso como reuso e revoga a
// sessão inteira, ver comentário em playwright.config.ts).
export const test = base.extend<object, { sharedContext: BrowserContext; sharedPage: Page }>({
  sharedContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        storageState: path.resolve(__dirname, ".auth", "session.json"),
      });
      await use(context);
      await context.close();
    },
    { scope: "worker" },
  ],

  sharedPage: [
    async ({ sharedContext }, use) => {
      const page = await sharedContext.newPage();
      await use(page);
    },
    { scope: "worker" },
  ],

  // Sobrescreve a fixture `page` padrão do Playwright (que criaria um
  // context/page novo por teste) para sempre devolver a mesma página viva.
  page: async ({ sharedPage }, use) => {
    // `use` aqui é o parâmetro de fixture do Playwright, não o hook use() do
    // React — a regra abaixo confunde os dois pelo nome do parâmetro.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(sharedPage);
  },
});

export { expect } from "@playwright/test";
