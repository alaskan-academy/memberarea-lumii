"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { GOAL_AREAS, GOAL_STATUS, type GoalArea, type GoalStatus } from "./types";

const AREA_VALUES = GOAL_AREAS.map((a) => a.value) as [GoalArea, ...GoalArea[]];
const STATUS_VALUES = GOAL_STATUS.map((s) => s.value) as [GoalStatus, ...GoalStatus[]];

function fichaPath(studentId: string): string {
  return `/ferramentas/meus-alunos/aluno/${studentId}`;
}

async function assertOwnsStudent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  teacherId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("teacher_students")
    .select("id")
    .eq("id", studentId)
    .eq("teacher_id", teacherId)
    .maybeSingle();
  return !!data;
}

/** Busca a meta se for do professor; devolve student_id (para revalidar). */
async function getOwnedGoal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  goalId: string,
  teacherId: string
): Promise<{ id: string; student_id: string } | null> {
  const { data } = await supabase
    .from("student_goals")
    .select("id, student_id")
    .eq("id", goalId)
    .eq("teacher_id", teacherId)
    .maybeSingle();
  return data ?? null;
}

// ─── Meta ──────────────────────────────────────────────────────────────────────

const CreateGoalSchema = z.object({
  student_id: z.string().uuid(),
  area: z.enum(AREA_VALUES),
  meta: z.string().trim().min(1, "Descreva a meta").max(500),
});

export async function createGoal(
  input: z.infer<typeof CreateGoalSchema>
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = CreateGoalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!(await assertOwnsStudent(supabase, parsed.data.student_id, user.id))) {
    return { error: "Aluno não encontrado" };
  }

  const { data, error } = await supabase
    .from("student_goals")
    .insert({ teacher_id: user.id, student_id: parsed.data.student_id, area: parsed.data.area, meta: parsed.data.meta })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(fichaPath(parsed.data.student_id));
  return { id: data.id };
}

const UpdateGoalSchema = z.object({
  goal_id: z.string().uuid(),
  area: z.enum(AREA_VALUES),
  meta: z.string().trim().min(1, "Descreva a meta").max(500),
});

export async function updateGoal(input: z.infer<typeof UpdateGoalSchema>): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = UpdateGoalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const goal = await getOwnedGoal(supabase, parsed.data.goal_id, user.id);
  if (!goal) return { error: "Meta não encontrada" };

  const { error } = await supabase
    .from("student_goals")
    .update({ area: parsed.data.area, meta: parsed.data.meta, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.goal_id);

  if (error) return { error: error.message };
  revalidatePath(fichaPath(goal.student_id));
  return {};
}

const StatusSchema = z.object({ goal_id: z.string().uuid(), status: z.enum(STATUS_VALUES) });

export async function setGoalStatus(input: z.infer<typeof StatusSchema>): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = StatusSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const goal = await getOwnedGoal(supabase, parsed.data.goal_id, user.id);
  if (!goal) return { error: "Meta não encontrada" };

  const { error } = await supabase
    .from("student_goals")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.goal_id);

  if (error) return { error: error.message };
  revalidatePath(fichaPath(goal.student_id));
  return {};
}

export async function deleteGoal(goalId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = z.string().uuid().safeParse(goalId);
  if (!parsed.success) return { error: "Meta inválida" };

  const goal = await getOwnedGoal(supabase, parsed.data, user.id);
  if (!goal) return { error: "Meta não encontrada" };

  // check-ins caem por ON DELETE CASCADE.
  const { error } = await supabase.from("student_goals").delete().eq("id", parsed.data);
  if (error) return { error: error.message };
  revalidatePath(fichaPath(goal.student_id));
  return {};
}

// ─── Check-in ──────────────────────────────────────────────────────────────────

const CheckinSchema = z.object({
  goal_id: z.string().uuid(),
  status: z.enum(["avancou", "estavel", "recuou"]),
  nota: z.string().trim().max(500).optional(),
});

export async function createGoalCheckin(input: z.infer<typeof CheckinSchema>): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = CheckinSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const goal = await getOwnedGoal(supabase, parsed.data.goal_id, user.id);
  if (!goal) return { error: "Meta não encontrada" };

  const { error } = await supabase
    .from("student_goal_checkins")
    .insert({ goal_id: parsed.data.goal_id, status: parsed.data.status, nota: parsed.data.nota || null });

  if (error) return { error: error.message };
  revalidatePath(fichaPath(goal.student_id));
  return {};
}

export async function deleteGoalCheckin(checkinId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = z.string().uuid().safeParse(checkinId);
  if (!parsed.success) return { error: "Check-in inválido" };

  // Confirma posse via a meta pai (o RLS também já protege).
  const { data: ck } = await supabase
    .from("student_goal_checkins")
    .select("id, goal_id, student_goals(teacher_id, student_id)")
    .eq("id", parsed.data)
    .maybeSingle();
  const parent = (ck as unknown as { student_goals: { teacher_id: string; student_id: string } | null } | null)
    ?.student_goals;
  if (!ck || !parent || parent.teacher_id !== user.id) return { error: "Check-in não encontrado" };

  const { error } = await supabase.from("student_goal_checkins").delete().eq("id", parsed.data);
  if (error) return { error: error.message };
  revalidatePath(fichaPath(parent.student_id));
  return {};
}
