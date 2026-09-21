import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import { generateCertificatePdf } from "./certificate";

// A4 paisagem em pontos. Gerar exatamente neste tamanho é o que garante que a
// impressão com "ajustar à página" (padrão da maioria dos leitores) saia
// inteira, sem corte — foi o problema relatado (certificado saindo cortado).
const A4_LANDSCAPE_W = 841.89;
const A4_LANDSCAPE_H = 595.28;

// Caminho opcional para salvar um exemplar e inspecionar visualmente.
// Definido só durante a revisão manual (CERT_PREVIEW_PATH); no CI fica off.
const previewPath = process.env.CERT_PREVIEW_PATH;

describe("generateCertificatePdf", () => {
  it("gera 1 página A4 paisagem (tamanho padrão de impressão)", async () => {
    const bytes = await generateCertificatePdf({
      studentName: "Maria Aparecida de Souza",
      cpf: "123.456.789-09",
      courseTitle: "Alfabetização e Letramento na Educação Infantil",
      workloadHours: 20,
      issuedAt: new Date("2026-09-21T12:00:00Z"),
      verifyHash: "abc123def456ghi789",
    });

    if (previewPath) fs.writeFileSync(previewPath, bytes);

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);

    const { width, height } = doc.getPage(0).getSize();
    expect(Math.round(width)).toBe(Math.round(A4_LANDSCAPE_W));
    expect(Math.round(height)).toBe(Math.round(A4_LANDSCAPE_H));
    expect(width).toBeGreaterThan(height); // paisagem, não retrato
  });

  it("nome e curso muito longos continuam em 1 página A4 (maxWidth protege o estouro)", async () => {
    const bytes = await generateCertificatePdf({
      studentName: "Maria Aparecida Conceição da Silva dos Santos Oliveira Souza Neto",
      cpf: null,
      courseTitle:
        "Curso Completo de Desenvolvimento Infantil, Alfabetização, Letramento e Práticas Pedagógicas Contemporâneas para a Primeira Infância",
      workloadHours: 1,
      issuedAt: new Date("2026-09-21T12:00:00Z"),
      verifyHash: "xyz000",
    });

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect(Math.round(width)).toBe(Math.round(A4_LANDSCAPE_W));
    expect(Math.round(height)).toBe(Math.round(A4_LANDSCAPE_H));
  });
});
