import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiarioTipo, StudentLogRow } from "./types";

/**
 * Diário de bordo de um aluno — mais recente primeiro.
 * Usa o client com RLS (request-scoped), nunca o service client: a própria
 * policy já garante que só vêm registros do professor logado, mas as páginas
 * também filtram por aluno (que já foi validado como sendo do professor).
 */
export async function fetchLogsForStudent(
  supabase: SupabaseClient,
  studentId: string
): Promise<StudentLogRow[]> {
  const { data } = await supabase
    .from("student_log")
    .select("id, tipo, texto, data, created_at")
    .eq("student_id", studentId)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    tipo: r.tipo as DiarioTipo,
    texto: r.texto,
    data: r.data,
    created_at: r.created_at,
  }));
}
