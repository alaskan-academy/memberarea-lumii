import type { SupabaseClient } from "@supabase/supabase-js";
import type { YearPlanRow } from "./types";

interface ConteudoJson {
  texto?: unknown;
}

/** Planejamentos da professora — mais recentes (ano/bimestre) primeiro. */
export async function fetchYearPlans(
  supabase: SupabaseClient,
  teacherId: string
): Promise<YearPlanRow[]> {
  const { data } = await supabase
    .from("year_plans")
    .select("id, titulo, ano, bimestre, componente, bncc_codes, conteudo, created_at, updated_at")
    .eq("teacher_id", teacherId)
    .order("ano", { ascending: false })
    .order("bimestre", { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id,
    titulo: r.titulo,
    ano: r.ano,
    bimestre: r.bimestre,
    componente: r.componente ?? null,
    bncc_codes: Array.isArray(r.bncc_codes) ? (r.bncc_codes as string[]) : [],
    texto: ((r.conteudo as ConteudoJson | null)?.texto ?? "").toString(),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}
