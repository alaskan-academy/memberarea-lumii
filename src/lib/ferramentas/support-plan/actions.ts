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

// ─── Plano de apoio ─────────────────────────────────────────────────────────────

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
    student_id: z.string().uuid(),
    dificuldade_principal: z.enum(DIFICULDADE_VALUES),
    dificuldade_principal_outro: z.string().trim().max(200).optional(),
    tambem_apresenta: z.array(z.string().trim().max(50)).max(10),
    ponto_forte: z.string().trim().max(500).optional(),
    ja_tentei: z.string().trim().max(500).optional(),
    plano_gerado: PlanoGeradoSchema,
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

  // Defesa extra além do RLS: confirma que o aluno é mesmo desse professor
  const { data: student } = await supabase
    .from("teacher_students")
    .select("id")
    .eq("id", parsed.data.student_id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!student) return { error: "Aluno não encontrado" };

  const { data, error } = await supabase
    .from("support_plans")
    .insert({
      student_id: parsed.data.student_id,
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
  revalidatePath(`/ferramentas/plano-apoio-aluno/${parsed.data.student_id}`);
  return { planId: data.id };
}

export async function closeSupportPlan(planId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: plan } = await supabase
    .from("support_plans")
    .select("id, student_id")
    .eq("id", planId)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!plan) return { error: "Plano não encontrado" };

  const { error } = await supabase
    .from("support_plans")
    .update({ status: "encerrado", updated_at: new Date().toISOString() })
    .eq("id", planId);

  if (error) return { error: error.message };
  revalidatePath(`/ferramentas/plano-apoio-aluno/${plan.student_id}`);
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
    .select("id, student_id")
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
  revalidatePath(`/ferramentas/plano-apoio-aluno/${plan.student_id}`);
  return {};
}
