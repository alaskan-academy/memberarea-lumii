import type { SupabaseClient } from "@supabase/supabase-js";
import type { BibliotecaTipo, LessonResourceRow, ResourceConteudo } from "./types";

/**
 * Biblioteca da professora — mais recente primeiro. Usa o client com RLS
 * (a policy já limita ao dono; a página também filtra por teacher_id).
 */
export async function fetchResources(
  supabase: SupabaseClient,
  teacherId: string
): Promise<LessonResourceRow[]> {
  const { data } = await supabase
    .from("lesson_resources")
    .select("id, titulo, tipo, conteudo, tags, created_at, updated_at")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    titulo: r.titulo,
    tipo: r.tipo as BibliotecaTipo,
    texto: ((r.conteudo as ResourceConteudo | null)?.texto ?? "").toString(),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}
