import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckinStatus, GoalArea, GoalCheckin, GoalRow, GoalStatus } from "./types";

/** Metas de um aluno + seus check-ins (mesmo padrão de fetchPlansForTarget). */
export async function fetchGoalsForStudent(
  supabase: SupabaseClient,
  studentId: string
): Promise<GoalRow[]> {
  const { data: goalsRaw } = await supabase
    .from("student_goals")
    .select("id, area, meta, status, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const goalIds = (goalsRaw ?? []).map((g) => g.id);

  const { data: checkinsRaw } = goalIds.length
    ? await supabase
        .from("student_goal_checkins")
        .select("id, goal_id, status, nota, created_at")
        .in("goal_id", goalIds)
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; goal_id: string; status: string; nota: string | null; created_at: string }[] };

  const byGoal = new Map<string, GoalCheckin[]>();
  for (const c of checkinsRaw ?? []) {
    const list = byGoal.get(c.goal_id) ?? [];
    list.push({ id: c.id, status: c.status as CheckinStatus, nota: c.nota, created_at: c.created_at });
    byGoal.set(c.goal_id, list);
  }

  return (goalsRaw ?? []).map((g) => ({
    id: g.id,
    area: g.area as GoalArea,
    meta: g.meta,
    status: g.status as GoalStatus,
    created_at: g.created_at,
    checkins: byGoal.get(g.id) ?? [],
  }));
}
