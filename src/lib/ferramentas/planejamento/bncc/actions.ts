"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getTier } from "@/lib/access/getTier";
import { tierAtLeast } from "@/lib/access/tier";

const PATH = "/ferramentas/planejamento";

// Normaliza códigos BNCC: maiúsculo, só letras/números, sem vazios/duplicados, teto 40.
function normalizarCodes(codes: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of codes) {
    const c = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= 40) break;
  }
  return out;
}

const PlanSchema = z.object({
  titulo: z.string().trim().min(1, "Dê um título").max(200),
  ano: z.number().int().min(2000).max(2100),
  bimestre: z.number().int().min(0).max(4),
  componente: z.string().trim().max(60).optional(),
  bncc_codes: z.array(z.string().max(30)).max(60).default([]),
  texto: z.string().max(20000).default(""),
});

/** Auth + tier Completo (o planejador BNCC é do Lumii Completo). */
async function requireCompleto() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" as const };
  const tier = await getTier(user.id);
  if (!tierAtLeast(tier, "completo")) return { error: "Disponível no Lumii Completo" as const };
  return { supabase, user };
}

export async function createYearPlan(
  input: z.infer<typeof PlanSchema>
): Promise<{ error?: string; id?: string }> {
  const auth = await requireCompleto();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const parsed = PlanSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from("year_plans")
    .insert({
      teacher_id: user.id,
      titulo: parsed.data.titulo,
      ano: parsed.data.ano,
      bimestre: parsed.data.bimestre,
      componente: parsed.data.componente || null,
      bncc_codes: normalizarCodes(parsed.data.bncc_codes),
      conteudo: { texto: parsed.data.texto },
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: data.id };
}

const UpdateSchema = PlanSchema.extend({ id: z.string().uuid() });

export async function updateYearPlan(
  input: z.infer<typeof UpdateSchema>
): Promise<{ error?: string }> {
  const auth = await requireCompleto();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: existing } = await supabase
    .from("year_plans")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Planejamento não encontrado" };

  const { error } = await supabase
    .from("year_plans")
    .update({
      titulo: parsed.data.titulo,
      ano: parsed.data.ano,
      bimestre: parsed.data.bimestre,
      componente: parsed.data.componente || null,
      bncc_codes: normalizarCodes(parsed.data.bncc_codes),
      conteudo: { texto: parsed.data.texto },
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

export async function deleteYearPlan(id: string): Promise<{ error?: string }> {
  const auth = await requireCompleto();
  if ("error" in auth) return { error: auth.error };
  const { supabase, user } = auth;

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "Planejamento inválido" };

  const { data: existing } = await supabase
    .from("year_plans")
    .select("id")
    .eq("id", parsed.data)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Planejamento não encontrado" };

  const { error } = await supabase.from("year_plans").delete().eq("id", parsed.data);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}
