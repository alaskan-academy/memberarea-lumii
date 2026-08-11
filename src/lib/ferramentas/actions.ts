"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Personalização apenas — nunca usar is_parent/is_teacher para bloquear acesso a nenhuma ferramenta.
export async function updateToolsProfile(input: {
  is_parent: boolean;
  is_teacher: boolean;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({ is_parent: input.is_parent, is_teacher: input.is_teacher })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/ferramentas");
  return {};
}
