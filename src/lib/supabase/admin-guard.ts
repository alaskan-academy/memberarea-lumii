import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Verifica se a usuária autenticada é admin. Uso padrão em Server Actions do
 * admin: `const { supabase, adminId } = await assertAdmin();` no topo da
 * função, envolto em try/catch para retornar `{ error }` em vez de deixar o
 * erro estourar (ver exemplos em `src/app/(admin)/admin/**\/actions.ts`).
 *
 * Lança erro em vez de retornar um resultado de falha — igual ao padrão que
 * já existia (duplicado) na maioria dos arquivos de actions do admin antes
 * desta extração.
 */
export async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Não autorizado");

  return { supabase, adminId: user.id };
}

/**
 * Variante para Server Components / páginas (`page.tsx` do admin). Em vez de
 * lançar — o que faria a usuária ver a página de erro do Next — REDIRECIONA:
 * para `/login` se não autenticada e para `/dashboard` se autenticada mas sem
 * role admin. Use no topo do componente da página:
 * `const { supabase, user } = await assertAdminPage();`.
 */
export async function assertAdminPage() {
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

  return { supabase, user };
}
