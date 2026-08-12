import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckinRow, SupportPlanRow } from "./types";

/** Busca planos + check-ins de um aluno ou turma — mesma consulta, só muda a coluna filtrada. */
export async function fetchPlansForTarget(
  supabase: SupabaseClient,
  column: "student_id" | "class_id",
  targetId: string
): Promise<SupportPlanRow[]> {
  const { data: plansRaw } = await supabase
    .from("support_plans")
    .select("id, dificuldade_principal, status, plano_gerado, created_at")
    .eq(column, targetId)
    .order("created_at", { ascending: false });

  const planIds = (plansRaw ?? []).map((p) => p.id);

  const { data: checkinsRaw } = planIds.length
    ? await supabase
        .from("support_plan_checkins")
        .select("id, support_plan_id, status, notes, created_at")
        .in("support_plan_id", planIds)
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; support_plan_id: string; status: string; notes: string | null; created_at: string }[] };

  const checkinsByPlan = new Map<string, CheckinRow[]>();
  for (const c of checkinsRaw ?? []) {
    const list = checkinsByPlan.get(c.support_plan_id) ?? [];
    list.push({
      id: c.id,
      status: c.status as CheckinRow["status"],
      notes: c.notes,
      created_at: c.created_at,
    });
    checkinsByPlan.set(c.support_plan_id, list);
  }

  return (plansRaw ?? []).map((p) => ({
    id: p.id,
    dificuldade_principal: p.dificuldade_principal,
    status: p.status as SupportPlanRow["status"],
    plano_gerado: p.plano_gerado as SupportPlanRow["plano_gerado"],
    created_at: p.created_at,
    checkins: checkinsByPlan.get(p.id) ?? [],
  }));
}
