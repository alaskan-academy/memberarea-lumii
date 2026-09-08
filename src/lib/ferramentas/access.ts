import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTier } from "@/lib/access/getTier";
import { TOOLS, hasToolAccess } from "./registry";

// SERVER-ONLY. Slugs das categorias em que a aluna tem curso ATIVO — usado para
// decidir a visibilidade das ferramentas (hasToolAccess). Usa o service client
// para atravessar a RLS de enrollments/courses/categories.
export async function getUserCourseCategories(
  userId: string | null | undefined
): Promise<Set<string>> {
  const set = new Set<string>();
  if (!userId) return set;

  const service = createServiceClient();
  const now = new Date().toISOString();
  const { data } = await service
    .from("enrollments")
    .select("course:courses(category:categories(slug))")
    .eq("user_id", userId)
    .or(`expires_at.is.null,expires_at.gte.${now}`);

  // to-one embeds vêm como objeto em runtime (o tipo do supabase-js infere array)
  for (const row of (data ?? []) as unknown as Array<{
    course: { category: { slug: string | null } | null } | null;
  }>) {
    const slug = row.course?.category?.slug;
    if (slug) set.add(slug);
  }
  return set;
}

// Guard server-side para as PÁGINAS de ferramenta — a filtragem do hub é só UX;
// aqui barramos o acesso direto por URL. Redireciona: sem login → /login;
// ferramenta inexistente ou sem acesso → /ferramentas (hub). Retorna o user.
// (Sub-rotas mais profundas seguem protegidas pela RLS dos dados da própria aluna.)
export async function assertToolAccess(slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) redirect("/ferramentas");

  const [tier, cats] = await Promise.all([getTier(user.id), getUserCourseCategories(user.id)]);
  if (!hasToolAccess(tool, tier, cats)) redirect("/ferramentas");

  return { user, supabase };
}
