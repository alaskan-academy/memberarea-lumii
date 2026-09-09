import type { SupabaseClient } from "@supabase/supabase-js";

// Mapa da turma (visão agregada do Bloco 1, tier Completo). Junta, por aluno,
// sinais de diário + plano de apoio + rubricas — para o conselho de classe.
// Só leitura; RLS já limita ao professor logado.

export interface AlunoMapa {
  id: string;
  name: string;
  class_label: string | null;
  diarioTotal: number;
  positivos: number; // registros tipo 'positivo' (conquistas)
  atencoes: number; // registros tipo 'atencao' (pontos de atenção)
  socioemocional: number; // registros tipo 'socioemocional'
  temPlanoAtivo: boolean;
  metasAtivas: number; // metas socioemocionais em andamento
  avaliacoes: number; // nº de avaliações de rubrica
  ultimaAtividade: string | null; // ISO do registro mais recente (diário/plano/meta/avaliação)
}

function maiorData(a: string | null, b: string): string {
  if (!a) return b;
  return b > a ? b : a;
}

export async function fetchTurmaMapa(
  supabase: SupabaseClient,
  teacherId: string
): Promise<AlunoMapa[]> {
  const [{ data: students }, { data: logs }, { data: plans }, { data: goals }, { data: scores }] = await Promise.all([
    supabase
      .from("teacher_students")
      .select("id, name, class_label")
      .eq("teacher_id", teacherId)
      .order("name", { ascending: true }),
    supabase.from("student_log").select("student_id, tipo, created_at").eq("teacher_id", teacherId),
    supabase.from("support_plans").select("student_id, status, created_at").eq("teacher_id", teacherId),
    supabase.from("student_goals").select("student_id, status, created_at").eq("teacher_id", teacherId),
    supabase.from("rubric_scores").select("student_id, created_at").eq("teacher_id", teacherId),
  ]);

  const mapa = new Map<string, AlunoMapa>();
  for (const s of students ?? []) {
    mapa.set(s.id, {
      id: s.id,
      name: s.name,
      class_label: s.class_label ?? null,
      diarioTotal: 0,
      positivos: 0,
      atencoes: 0,
      socioemocional: 0,
      temPlanoAtivo: false,
      metasAtivas: 0,
      avaliacoes: 0,
      ultimaAtividade: null,
    });
  }

  for (const l of logs ?? []) {
    const a = mapa.get(l.student_id);
    if (!a) continue;
    a.diarioTotal += 1;
    if (l.tipo === "positivo") a.positivos += 1;
    else if (l.tipo === "atencao") a.atencoes += 1;
    else if (l.tipo === "socioemocional") a.socioemocional += 1;
    a.ultimaAtividade = maiorData(a.ultimaAtividade, l.created_at);
  }

  for (const p of plans ?? []) {
    if (!p.student_id) continue; // planos de turma não entram no mapa por aluno
    const a = mapa.get(p.student_id);
    if (!a) continue;
    if (p.status === "ativo") a.temPlanoAtivo = true;
    a.ultimaAtividade = maiorData(a.ultimaAtividade, p.created_at);
  }

  for (const g of goals ?? []) {
    const a = mapa.get(g.student_id);
    if (!a) continue;
    if (g.status === "em_andamento") a.metasAtivas += 1;
    a.ultimaAtividade = maiorData(a.ultimaAtividade, g.created_at);
  }

  for (const sc of scores ?? []) {
    const a = mapa.get(sc.student_id);
    if (!a) continue;
    a.avaliacoes += 1;
    a.ultimaAtividade = maiorData(a.ultimaAtividade, sc.created_at);
  }

  return [...mapa.values()];
}
