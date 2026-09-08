// Detecção de tier — SERVER-ONLY. Calcula no banco (current_tier), que é a
// fonte única de verdade; getTier e current_tier nunca divergem.
// current_tier foi revogada de anon/authenticated e concedida só a service_role,
// então precisa do service client E do uid explícito (o service client não tem
// contexto de auth). Nunca chamar isto de um client component.
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { Tier } from "./tier";

/**
 * Tier da aluna cujo id foi passado. Fail-closed: qualquer erro/ausência →
 * "visitante" (o piso — nunca concede acesso a mais por engano).
 */
export async function getTier(userId: string | null | undefined): Promise<Tier> {
  if (!userId) return "visitante";
  const service = createServiceClient();
  const { data, error } = await service.rpc("current_tier", { p_user_id: userId });
  if (error || typeof data !== "string") return "visitante";
  return data as Tier;
}

/** Conveniência: tier da aluna logada (resolve a sessão e delega a getTier). */
export async function getCurrentTier(): Promise<Tier> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return getTier(user?.id ?? null);
}
