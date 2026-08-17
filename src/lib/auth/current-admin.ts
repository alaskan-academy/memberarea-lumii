import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentAdmin = {
  id: string;
  email: string | null;
};

/**
 * Confirma que o utilizador autenticado é admin, redirecionando caso não seja
 * (`/login` sem sessão, `/dashboard` sem role admin).
 *
 * Memoizado por request via `cache()` do React — chamar esta função em vários
 * Server Components (layout + página + página aninhada) no mesmo request
 * dispara apenas UMA consulta ao Supabase, mesmo sem passar dados via props.
 *
 * Não usar em Server Actions/route handlers isoladas — `cache()` só memoiza
 * dentro do mesmo request de renderização; cada Server Action é seu próprio
 * request e deve continuar validando o role diretamente quando necessário.
 */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return { id: user.id, email: user.email ?? null };
});
