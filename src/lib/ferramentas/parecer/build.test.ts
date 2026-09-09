import { describe, it, expect } from "vitest";
import { buildParecer } from "./build";
import { FECHAMENTO } from "./content";

describe("buildParecer", () => {
  it("sem aspecto incluído devolve string vazia", () => {
    expect(buildParecer({ nome: "Ana", periodo: "1º bimestre", aspectos: {} })).toBe("");
  });

  it("monta com nome, período e fechamento", () => {
    const t = buildParecer({
      nome: "Maria",
      periodo: "1º bimestre",
      aspectos: { participacao: "consolidado" },
    });
    expect(t).toContain("Ao longo do 1º bimestre, Maria participa");
    expect(t.endsWith(FECHAMENTO)).toBe(true);
  });

  it("sem nome usa 'o(a) estudante' e capitaliza quando não há período", () => {
    const t = buildParecer({ nome: "", periodo: "", aspectos: { autonomia: "em_progresso" } });
    expect(t.startsWith("O(a) estudante ")).toBe(true);
  });

  it("junta vários aspectos com ponto-e-vírgula, na ordem canônica", () => {
    const t = buildParecer({
      nome: "João",
      periodo: "ano",
      aspectos: { autonomia: "consolidado", participacao: "consolidado" },
    });
    // participacao vem antes de autonomia na ordem de ASPECTOS
    expect(t.indexOf("participa")).toBeLessThan(t.indexOf("autonomia"));
    expect(t).toContain("; ");
  });

  it("acrescenta a observação livre e garante o ponto final", () => {
    const t = buildParecer({
      nome: "Ana",
      periodo: "2º bimestre",
      aspectos: { convivencia: "em_progresso" },
      observacao: "Tem faltado às segundas",
    });
    expect(t).toContain("Tem faltado às segundas.");
  });
});
