import sharp from "sharp";

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;

export type PreparedUpload = {
  buffer: Buffer;
  contentType: string;
  /** Extensão sem ponto — "webp" após conversão, ou a extensão original quando não convertida. */
  ext: string;
};

function originalExt(file: File): string {
  return file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
}

/**
 * Converte imagens (JPEG/PNG/GIF/etc.) para WebP antes do upload — reduz o
 * tamanho do arquivo sem perda visual perceptível (qualidade 82) e limita a
 * maior dimensão a 2000px. GIFs animados mantêm a animação (WebP suporta).
 * SVG e arquivos que já são WebP sobem sem conversão. Não-imagens (PDF, ZIP
 * etc.) passam direto, sem tentar converter.
 *
 * Se a conversão falhar por qualquer motivo, cai de volta pro arquivo
 * original em vez de travar o upload inteiro.
 */
export async function prepareImageForUpload(file: File): Promise<PreparedUpload> {
  const originalBuffer = Buffer.from(await file.arrayBuffer());

  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/webp") {
    return { buffer: originalBuffer, contentType: file.type || "application/octet-stream", ext: originalExt(file) };
  }

  try {
    const buffer = await sharp(originalBuffer, { animated: true })
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    return { buffer, contentType: "image/webp", ext: "webp" };
  } catch (e) {
    console.error("[to-webp] Conversão falhou, enviando original:", (e as Error).message);
    return { buffer: originalBuffer, contentType: file.type, ext: originalExt(file) };
  }
}
