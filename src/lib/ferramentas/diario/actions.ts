"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { DIARIO_TIPOS, type DiarioTipo } from "./types";

// Enum do Zod derivado do vocabulário único (types.ts) — que por sua vez espelha
// o CHECK da coluna. Um lugar só define os valores.
const TIPO_VALUES = DIARIO_TIPOS.map((t) => t.value) as [DiarioTipo, ...DiarioTipo[]];

// Data do fato: YYYY-MM-DD, uma data de calendário REAL e num intervalo são
// (rejeita "0000-00-00", ano 9999 e datas impossíveis tipo 30/02 — Date.parse
// não pega essas, o V8 "rola" pro mês seguinte, então validamos por round-trip).
// Não trava "futuro" no servidor pra não brigar com fuso — a UI já limita com max=hoje.
const DataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    if (y < 2000 || y > 2100) return false;
    const dt = new Date(y, m - 1, d); // local — só checando validade de calendário
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }, "Data inválida");

function fichaPath(studentId: string): string {
  return `/ferramentas/meus-alunos/aluno/${studentId}`;
}

/** Confirma (além do RLS) que o aluno é mesmo deste professor. */
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

const CreateLogSchema = z.object({
  student_id: z.string().uuid(),
  tipo: z.enum(TIPO_VALUES),
  texto: z.string().trim().min(1, "Escreva o registro").max(2000),
  data: DataSchema,
});

export async function createLog(
  input: z.infer<typeof CreateLogSchema>
): Promise<{ error?: string; logId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = CreateLogSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Defesa extra além do RLS: o aluno tem de ser deste professor.
  if (!(await assertOwnsStudent(supabase, parsed.data.student_id, user.id))) {
    return { error: "Aluno não encontrado" };
  }

  const { data, error } = await supabase
    .from("student_log")
    .insert({
      teacher_id: user.id,
      student_id: parsed.data.student_id,
      tipo: parsed.data.tipo,
      texto: parsed.data.texto,
      data: parsed.data.data,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(fichaPath(parsed.data.student_id));
  return { logId: data.id };
}

const UpdateLogSchema = z.object({
  log_id: z.string().uuid(),
  tipo: z.enum(TIPO_VALUES),
  texto: z.string().trim().min(1, "Escreva o registro").max(2000),
  data: DataSchema,
});

export async function updateLog(
  input: z.infer<typeof UpdateLogSchema>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = UpdateLogSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Só edita registro do próprio professor; pega student_id para revalidar.
  const { data: log } = await supabase
    .from("student_log")
    .select("id, student_id")
    .eq("id", parsed.data.log_id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!log) return { error: "Registro não encontrado" };

  const { error } = await supabase
    .from("student_log")
    .update({
      tipo: parsed.data.tipo,
      texto: parsed.data.texto,
      data: parsed.data.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.log_id);

  if (error) return { error: error.message };
  revalidatePath(fichaPath(log.student_id));
  return {};
}

export async function deleteLog(logId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = z.string().uuid().safeParse(logId);
  if (!parsed.success) return { error: "Registro inválido" };

  const { data: log } = await supabase
    .from("student_log")
    .select("id, student_id")
    .eq("id", parsed.data)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!log) return { error: "Registro não encontrado" };

  const { error } = await supabase.from("student_log").delete().eq("id", parsed.data);
  if (error) return { error: error.message };
  revalidatePath(fichaPath(log.student_id));
  return {};
}
