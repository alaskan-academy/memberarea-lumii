"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const DIFICULDADE_VALUES = [
  "iniciar_atividades",
  "manter_atencao",
  "seguir_instrucoes",
  "controlar_frustracao",
  "interagir_com_colegas",
  "participar_em_grupo",
  "concluir_tarefas",
  "lidar_com_mudancas_rotina",
  "outro",
] as const;

function targetPath(studentId: string | null, classId: string | null): string {
  return studentId
    ? `/ferramentas/plano-apoio-aluno/aluno/${studentId}`
    : `/ferramentas/plano-apoio-aluno/turma/${classId}`;
}

// ─── Alunos (cadastro mínimo do professor) ─────────────────────────────────────

const TeacherStudentSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(200),
  age: z.number().int().min(0).max(25).nullable().optional(),
  class_label: z.string().trim().max(100).nullable().optional(),
});

export type TeacherStudentRow = {
  id: string;
  name: string;
  age: number | null;
  class_label: string | null;
};

export async function createTeacherStudent(
  input: z.infer<typeof TeacherStudentSchema>
): Promise<{ error?: string; student?: TeacherStudentRow }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = TeacherStudentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from("teacher_students")
    .insert({
      teacher_id: user.id,
      name: parsed.data.name,
      age: parsed.data.age ?? null,
      class_label: parsed.data.class_label || null,
    })
    .select("id, name, age, class_label")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/ferramentas/plano-apoio-aluno");
  return { student: data };
}

// ─── Turmas (cadastro mínimo do professor) ─────────────────────────────────────

const TeacherClassSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(200),
});

export type TeacherClassRow = {
  id: string;
  name: string;
};

export async function createTeacherClass(
  input: z.infer<typeof TeacherClassSchema>
): Promise<{ error?: string; teacherClass?: TeacherClassRow }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = TeacherClassSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from("teacher_classes")
    .insert({ teacher_id: user.id, name: parsed.data.name })
    .select("id, name")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/ferramentas/plano-apoio-aluno");
  return { teacherClass: data };
}

// ─── Plano de apoio (aluno OU turma — nunca os dois, nunca nenhum) ─────────────

const PlanoGeradoSchema = z.object({
  objetivo: z.string().trim().min(1, "Objetivo não pode ficar vazio"),
  antes_da_atividade: z.string().trim().min(1, "Campo não pode ficar vazio"),
  durante: z.string().trim().min(1, "Campo não pode ficar vazio"),
  se_houver_recusa: z.string().trim().min(1, "Campo não pode ficar vazio"),
  o_que_observar: z.string().trim().min(1, "Campo não pode ficar vazio"),
  sugestao_coordenacao: z.string().trim().nullable(),
});

const SaveSupportPlanSchema = z
  .object({
    student_id: z.string().uuid().optional(),
    class_id: z.string().uuid().optional(),
    dificuldade_principal: z.enum(DIFICULDADE_VALUES),
    dificuldade_principal_outro: z.string().trim().max(200).optional(),
    tambem_apresenta: z.array(z.string().trim().max(50)).max(10),
    ponto_forte: z.string().trim().max(500).optional(),
    ja_tentei: z.string().trim().max(500).optional(),
    plano_gerado: PlanoGeradoSchema,
  })
  .refine((v) => !!v.student_id !== !!v.class_id, {
    message: "Informe um aluno ou uma turma, não os dois",
    path: ["student_id"],
  })
  .refine((v) => v.dificuldade_principal !== "outro" || !!v.dificuldade_principal_outro, {
    message: "Descreva a dificuldade quando selecionar \"Outro\"",
    path: ["dificuldade_principal_outro"],
  });

export async function saveSupportPlan(
  input: z.infer<typeof SaveSupportPlanSchema>
): Promise<{ error?: string; planId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = SaveSupportPlanSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Defesa extra além do RLS: confirma que o aluno/turma é mesmo desse professor
  const targetTable = parsed.data.student_id ? "teacher_students" : "teacher_classes";
  const targetId = (parsed.data.student_id ?? parsed.data.class_id)!;
  const { data: target } = await supabase
    .from(targetTable)
    .select("id")
    .eq("id", targetId)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!target) return { error: parsed.data.student_id ? "Aluno não encontrado" : "Turma não encontrada" };

  const { data, error } = await supabase
    .from("support_plans")
    .insert({
      student_id: parsed.data.student_id ?? null,
      class_id: parsed.data.class_id ?? null,
      teacher_id: user.id,
      dificuldade_principal: parsed.data.dificuldade_principal,
      dificuldade_principal_outro: parsed.data.dificuldade_principal_outro || null,
      tambem_apresenta: parsed.data.tambem_apresenta,
      ponto_forte: parsed.data.ponto_forte || null,
      ja_tentei: parsed.data.ja_tentei || null,
      plano_gerado: parsed.data.plano_gerado,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(targetPath(parsed.data.student_id ?? null, parsed.data.class_id ?? null));
  return { planId: data.id };
}

const UpdateSupportPlanSchema = z.object({
  plan_id: z.string().uuid(),
  plano_gerado: PlanoGeradoSchema,
});

export async function updateSupportPlan(
  input: z.infer<typeof UpdateSupportPlanSchema>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = UpdateSupportPlanSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: plan } = await supabase
    .from("support_plans")
    .select("id, student_id, class_id")
    .eq("id", parsed.data.plan_id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!plan) return { error: "Plano não encontrado" };

  const { error } = await supabase
    .from("support_plans")
    .update({ plano_gerado: parsed.data.plano_gerado, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.plan_id);

  if (error) return { error: error.message };
  revalidatePath(targetPath(plan.student_id, plan.class_id));
  return {};
}

export async function deleteSupportPlan(planId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: plan } = await supabase
    .from("support_plans")
    .select("id, student_id, class_id")
    .eq("id", planId)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!plan) return { error: "Plano não encontrado" };

  const { error } = await supabase.from("support_plans").delete().eq("id", planId);
  if (error) return { error: error.message };
  revalidatePath(targetPath(plan.student_id, plan.class_id));
  return {};
}

export async function closeSupportPlan(planId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: plan } = await supabase
    .from("support_plans")
    .select("id, student_id, class_id")
    .eq("id", planId)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!plan) return { error: "Plano não encontrado" };

  const { error } = await supabase
    .from("support_plans")
    .update({ status: "encerrado", updated_at: new Date().toISOString() })
    .eq("id", planId);

  if (error) return { error: error.message };
  revalidatePath(targetPath(plan.student_id, plan.class_id));
  return {};
}

// ─── Check-in ─────────────────────────────────────────────────────────────────

const CheckinSchema = z.object({
  support_plan_id: z.string().uuid(),
  status: z.enum(["melhorou", "igual", "piorou"]),
  notes: z.string().trim().max(500).optional(),
});

export async function createCheckin(
  input: z.infer<typeof CheckinSchema>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = CheckinSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: plan } = await supabase
    .from("support_plans")
    .select("id, student_id, class_id")
    .eq("id", parsed.data.support_plan_id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!plan) return { error: "Plano não encontrado" };

  const { error } = await supabase.from("support_plan_checkins").insert({
    support_plan_id: parsed.data.support_plan_id,
    status: parsed.data.status,
    notes: parsed.data.notes || null,
  });

  if (error) return { error: error.message };
  revalidatePath(targetPath(plan.student_id, plan.class_id));
  return {};
}
