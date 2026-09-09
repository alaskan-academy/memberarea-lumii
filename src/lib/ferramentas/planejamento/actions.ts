"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { BIBLIOTECA_TIPOS, type BibliotecaTipo } from "./types";

const TIPO_VALUES = BIBLIOTECA_TIPOS.map((t) => t.value) as [BibliotecaTipo, ...BibliotecaTipo[]];

const PATH = "/ferramentas/planejamento";

// Normaliza tags: apara, remove vazias e duplicadas, limita a 15.
function normalizarTags(tags: string[]): string[] {
  const vistas = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().slice(0, 40);
    if (!t) continue;
    const key = t.toLowerCase();
    if (vistas.has(key)) continue;
    vistas.add(key);
    out.push(t);
    if (out.length >= 15) break;
  }
  return out;
}

const ResourceSchema = z.object({
  titulo: z.string().trim().min(1, "Dê um título").max(200),
  tipo: z.enum(TIPO_VALUES),
  texto: z.string().max(20000).default(""),
  tags: z.array(z.string().max(60)).max(50).default([]),
});

export async function createResource(
  input: z.infer<typeof ResourceSchema>
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = ResourceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from("lesson_resources")
    .insert({
      teacher_id: user.id,
      titulo: parsed.data.titulo,
      tipo: parsed.data.tipo,
      conteudo: { texto: parsed.data.texto },
      tags: normalizarTags(parsed.data.tags),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: data.id };
}

const UpdateSchema = ResourceSchema.extend({ id: z.string().uuid() });

export async function updateResource(
  input: z.infer<typeof UpdateSchema>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Só edita material do próprio professor (defesa extra além do RLS).
  const { data: existing } = await supabase
    .from("lesson_resources")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Material não encontrado" };

  const { error } = await supabase
    .from("lesson_resources")
    .update({
      titulo: parsed.data.titulo,
      tipo: parsed.data.tipo,
      conteudo: { texto: parsed.data.texto },
      tags: normalizarTags(parsed.data.tags),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

export async function deleteResource(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "Material inválido" };

  const { data: existing } = await supabase
    .from("lesson_resources")
    .select("id")
    .eq("id", parsed.data)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Material não encontrado" };

  const { error } = await supabase.from("lesson_resources").delete().eq("id", parsed.data);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/** Duplica um material do próprio professor para adaptar (reusar ano a ano). */
export async function duplicateResource(id: string): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "Material inválido" };

  const { data: orig } = await supabase
    .from("lesson_resources")
    .select("titulo, tipo, conteudo, tags")
    .eq("id", parsed.data)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!orig) return { error: "Material não encontrado" };

  const { data, error } = await supabase
    .from("lesson_resources")
    .insert({
      teacher_id: user.id,
      titulo: `${orig.titulo} (cópia)`.slice(0, 200),
      tipo: orig.tipo,
      conteudo: orig.conteudo,
      tags: orig.tags,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: data.id };
}
