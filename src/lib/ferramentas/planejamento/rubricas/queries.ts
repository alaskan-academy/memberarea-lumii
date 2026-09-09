import type { SupabaseClient } from "@supabase/supabase-js";
import type { RubricCriterio, RubricRow, RubricScoreRow } from "./types";

interface CriteriosJson {
  escala?: unknown;
  itens?: unknown;
}

function parseCriterios(raw: unknown): { escala: string[]; itens: RubricCriterio[] } {
  const c = (raw ?? {}) as CriteriosJson;
  const escala = Array.isArray(c.escala) ? c.escala.map((x) => String(x)) : [];
  const itens = Array.isArray(c.itens)
    ? c.itens
        .filter((i): i is { id: unknown; nome: unknown } => !!i && typeof i === "object")
        .map((i) => ({ id: String(i.id ?? ""), nome: String(i.nome ?? "") }))
        .filter((i) => i.id && i.nome)
    : [];
  return { escala, itens };
}

/** Rubricas (templates) da professora. */
export async function fetchRubrics(
  supabase: SupabaseClient,
  teacherId: string
): Promise<RubricRow[]> {
  const { data } = await supabase
    .from("rubrics")
    .select("id, titulo, criterios, created_at, updated_at")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => {
    const { escala, itens } = parseCriterios(r.criterios);
    return { id: r.id, titulo: r.titulo, escala, itens, created_at: r.created_at, updated_at: r.updated_at };
  });
}

interface ScoreNotasJson {
  niveis?: unknown;
  comentario?: unknown;
}

/** Todas as avaliações da professora (com o nome do aluno). A seção filtra por rubrica. */
export async function fetchAllScores(
  supabase: SupabaseClient,
  teacherId: string
): Promise<RubricScoreRow[]> {
  const { data } = await supabase
    .from("rubric_scores")
    .select("id, rubric_id, student_id, notas, created_at, teacher_students(name)")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((s) => {
    // Embed to-one vem tipado como array no PostgREST.
    const aluno = (s as unknown as { teacher_students: { name: string } | null }).teacher_students;
    const notas = (s.notas ?? {}) as ScoreNotasJson;
    const niveisRaw = (notas.niveis ?? {}) as Record<string, unknown>;
    const niveis: Record<string, number> = {};
    for (const [k, v] of Object.entries(niveisRaw)) {
      const n = Number(v);
      if (Number.isInteger(n) && n >= 0) niveis[k] = n;
    }
    return {
      id: s.id,
      rubric_id: s.rubric_id,
      student_id: s.student_id,
      studentName: aluno?.name ?? "Aluno",
      niveis,
      comentario: typeof notas.comentario === "string" ? notas.comentario : "",
      created_at: s.created_at,
    };
  });
}
