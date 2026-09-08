import { describe, it, expect } from "vitest";
import { tierAtLeast, tierRank } from "./tier";

describe("tier — ordenação e gate", () => {
  it("respeita visitante < gratis < aluna < completo < admin", () => {
    expect(tierRank("visitante")).toBeLessThan(tierRank("gratis"));
    expect(tierRank("gratis")).toBeLessThan(tierRank("aluna"));
    expect(tierRank("aluna")).toBeLessThan(tierRank("completo"));
    expect(tierRank("completo")).toBeLessThan(tierRank("admin"));
  });

  it("libera quando o tier atual >= o requerido", () => {
    expect(tierAtLeast("aluna", "aluna")).toBe(true);
    expect(tierAtLeast("completo", "aluna")).toBe(true);
    expect(tierAtLeast("admin", "completo")).toBe(true); // equipe passa em tudo
  });

  it("bloqueia quando o tier atual < o requerido", () => {
    expect(tierAtLeast("visitante", "gratis")).toBe(false);
    expect(tierAtLeast("gratis", "aluna")).toBe(false);
    // ex-assinante (caiu para aluna) não acessa conteúdo do Completo
    expect(tierAtLeast("aluna", "completo")).toBe(false);
  });
});
