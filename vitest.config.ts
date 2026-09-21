import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Espelha o alias @/* → ./src/* do tsconfig para que os testes possam importar
  // módulos do app (ex.: src/lib/certificate.ts, que importa @/lib/fonts/...).
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    // Só testes unitários em src/. Os specs Playwright (e2e/) rodam via
    // `npm run test:e2e` — se o Vitest tentar coletá-los, quebra em test.describe().
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
  },
});
