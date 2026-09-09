"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const PATH = "/ferramentas/planejamento";

// ─── Rubrica (template) ────────────────────────────────────────────────────────

const RubricSchema = z.object({
  titulo: z.string().trim().min(1, "Dê um título à rubrica").max(200),
  escala: z.array(z.string().trim().min(1).max(40)).min(2, "A escala precisa de ao menos 2 níveis").max(6),
  itens: z
    .array(z.object({ id: z.string().min(1).max(60), nome: z.string().trim().min(1).max(120) }))
    .min(1, "Adicione ao menos um critério")
    .max(30),
});

export async function createRubric(
  input: z.infer<typeof RubricSchema>
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = RubricSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from("rubrics")
    .insert({
      teacher_id: user.id,
      titulo: parsed.data.titulo,
      criterios: { escala: parsed.data.escala, itens: parsed.data.itens },
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: data.id };
}

const UpdateRubricSchema = RubricSchema.extend({ id: z.string().uuid() });

export async function updateRubric(
  input: z.infer<typeof UpdateRubricSchema>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = UpdateRubricSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: existing } = await supabase
    .from("rubrics")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Rubrica não encontrada" };

  const { error } = await supabase
    .from("rubrics")
    .update({
      titulo: parsed.data.titulo,
      criterios: { escala: parsed.data.escala, itens: parsed.data.itens },
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

export async function deleteRubric(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "Rubrica inválida" };

  const { data: existing } = await supabase
    .from("rubrics")
    .select("id")
    .eq("id", parsed.data)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Rubrica não encontrada" };

  // rubric_scores cai junto por ON DELETE CASCADE.
  const { error } = await supabase.from("rubrics").delete().eq("id", parsed.data);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

export async function duplicateRubric(id: string): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "Rubrica inválida" };

  const { data: orig } = await supabase
    .from("rubrics")
    .select("titulo, criterios")
    .eq("id", parsed.data)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!orig) return { error: "Rubrica não encontrada" };

  const { data, error } = await supabase
    .from("rubrics")
    .insert({
      teacher_id: user.id,
      titulo: `${orig.titulo} (cópia)`.slice(0, 200),
      criterios: orig.criterios,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: data.id };
}

// ─── Avaliação (aplicar rubrica a um aluno) ────────────────────────────────────

const ScoreSchema = z.object({
  rubric_id: z.string().uuid(),
  student_id: z.string().uuid(),
  niveis: z.record(z.string(), z.number().int().min(0).max(20)),
  comentario: z.string().trim().max(1000).optional(),
});

export async function saveScore(
  input: z.infer<typeof ScoreSchema>
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = ScoreSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // A rubrica é deste professor? (e pega a escala/itens para validar as notas)
  const { data: rubric } = await supabase
    .from("rubrics")
    .select("id, criterios")
    .eq("id", parsed.data.rubric_id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!rubric) return { error: "Rubrica não encontrada" };

  // O aluno é deste professor?
  const { data: student } = await supabase
    .from("teacher_students")
    .select("id")
    .eq("id", parsed.data.student_id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!student) return { error: "Aluno não encontrado" };

  // Valida as notas contra o template: só ids de critério válidos e índice < nº de níveis.
  const criterios = (rubric.criterios ?? {}) as { escala?: unknown; itens?: unknown };
  const escalaLen = Array.isArray(criterios.escala) ? criterios.escala.length : 0;
  const idsValidos = new Set(
    (Array.isArray(criterios.itens) ? criterios.itens : [])
      .map((i) => (i && typeof i === "object" ? String((i as { id?: unknown }).id ?? "") : ""))
      .filter(Boolean)
  );
  const niveis: Record<string, number> = {};
  for (const [k, v] of Object.entries(parsed.data.niveis)) {
    if (idsValidos.has(k) && v >= 0 && v < escalaLen) niveis[k] = v;
  }
  if (Object.keys(niveis).length === 0) return { error: "Marque ao menos um critério" };

  const { data, error } = await supabase
    .from("rubric_scores")
    .insert({
      teacher_id: user.id,
      rubric_id: parsed.data.rubric_id,
      student_id: parsed.data.student_id,
      notas: { niveis, comentario: parsed.data.comentario || "" },
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: data.id };
}

export async function deleteScore(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "Avaliação inválida" };

  const { data: existing } = await supabase
    .from("rubric_scores")
    .select("id")
    .eq("id", parsed.data)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Avaliação não encontrada" };

  const { error } = await supabase.from("rubric_scores").delete().eq("id", parsed.data);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}
