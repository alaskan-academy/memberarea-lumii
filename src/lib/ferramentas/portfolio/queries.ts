import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import type { PortfolioItem } from "./types";

const BUCKET = "portfolio";
const SIGNED_TTL = 3600; // 1h — a ficha é revalidada a cada acesso

/**
 * Itens do portfólio de um aluno, com URL ASSINADA para cada foto (bucket
 * privado). A leitura da tabela usa o client com RLS (só traz itens do
 * professor); a assinatura das fotos usa o service client (as paths já são
 * comprovadamente deste professor — a própria RLS da tabela garantiu isso).
 */
export async function fetchPortfolioForStudent(
  supabase: SupabaseClient,
  studentId: string
): Promise<PortfolioItem[]> {
  const { data } = await supabase
    .from("student_portfolio")
    .select("id, titulo, descricao, anexo_path, anexo_mime, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const paths = rows.map((r) => r.anexo_path).filter((p): p is string => !!p);

  const signed = new Map<string, string>();
  if (paths.length) {
    const service = createServiceClient();
    const { data: urls } = await service.storage.from(BUCKET).createSignedUrls(paths, SIGNED_TTL);
    for (const u of urls ?? []) {
      if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    titulo: r.titulo,
    descricao: r.descricao ?? "",
    anexoUrl: r.anexo_path ? signed.get(r.anexo_path) ?? null : null,
    anexoMime: r.anexo_mime ?? null,
    created_at: r.created_at,
  }));
}
