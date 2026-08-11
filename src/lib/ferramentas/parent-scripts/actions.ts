"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleParentScriptFavorite(
  scriptKey: string
): Promise<{ favorited: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };
  if (!scriptKey.trim()) return { error: "script_key inválido" };

  const { data: existing } = await supabase
    .from("parent_script_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("script_key", scriptKey)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("parent_script_favorites")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath("/ferramentas/o-que-eu-digo-agora/favoritos");
    return { favorited: false };
  }

  const { error } = await supabase
    .from("parent_script_favorites")
    .insert({ user_id: user.id, script_key: scriptKey });
  if (error) return { error: error.message };
  revalidatePath("/ferramentas/o-que-eu-digo-agora/favoritos");
  return { favorited: true };
}

// Fire-and-forget: analytics de visualização, nunca deve quebrar a UI
export async function logParentScriptView(scriptKey: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !scriptKey.trim()) return;

  const { error } = await supabase
    .from("parent_script_views")
    .insert({ user_id: user.id, script_key: scriptKey });
  if (error) console.error("[logParentScriptView] error:", error);
}
