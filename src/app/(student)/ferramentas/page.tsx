import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import FerramentaCard from "@/components/ferramentas/hub/FerramentaCard";
import ToolsProfileBanner from "@/components/ferramentas/hub/ToolsProfileBanner";
import { TOOLS, hasToolAccess } from "@/lib/ferramentas/registry";
import { getTier } from "@/lib/access/getTier";
import { getUserCourseCategories } from "@/lib/ferramentas/access";

export const metadata: Metadata = { title: "Ferramentas — Lumii" };

export default async function FerramentasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, tier, userCategories] = await Promise.all([
    supabase.from("profiles").select("is_parent, is_teacher").eq("id", user.id).single(),
    getTier(user.id),
    getUserCourseCategories(user.id),
  ]);

  const showOnboarding = !profile?.is_parent && !profile?.is_teacher;

  // Cada ferramenta paga aparece só para quem tem curso na categoria dela;
  // gratuita, para todos; completo/admin veem tudo.
  const visible = TOOLS.filter((t) => hasToolAccess(t, tier, userCategories));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-6">
        <p className="text-sm font-medium text-lumii-coral uppercase tracking-wide mb-1">
          Ferramentas
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold">Tenho essa situação agora</h1>
        <p className="text-muted-foreground mt-1">
          Utilitários rápidos para o dia a dia com crianças — sem precisar ler nada longo.
        </p>
      </div>

      {showOnboarding && <ToolsProfileBanner />}

      {visible.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((t) => (
            <FerramentaCard
              key={t.slug}
              href={`/ferramentas/${t.slug}`}
              icon={t.icon}
              title={t.title}
              subtitle={t.subtitle}
              description={t.description}
              publico={t.publico}
            />
          ))}
        </div>
      ) : (
        <div className="lumii-card p-8 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-lumii-coral/15 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-lumii-coral" />
          </div>
          <h2 className="text-lg font-bold text-foreground">As ferramentas vêm com os cursos</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Cada ferramenta é liberada pelos cursos que você tem. Explore o catálogo e
            desbloqueie as ferramentas da sua área.
          </p>
          <Link
            href="/cursos"
            prefetch={false}
            className="mt-1 inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg bg-lumii-coral text-white text-sm font-semibold hover:bg-lumii-coral-hover transition-colors"
          >
            Ver cursos
          </Link>
        </div>
      )}
    </div>
  );
}
