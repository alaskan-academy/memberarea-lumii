import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

      {/* Todas aparecem. Sem acesso (categoria/tier) → card bloqueado que leva ao
          catálogo; gratuita → aberta a todos; completo/admin → tudo liberado. */}
      <div className="grid sm:grid-cols-2 gap-4">
        {TOOLS.map((t) => (
          <FerramentaCard
            key={t.slug}
            href={`/ferramentas/${t.slug}`}
            icon={t.icon}
            title={t.title}
            subtitle={t.subtitle}
            description={t.description}
            publico={t.publico}
            locked={!hasToolAccess(t, tier, userCategories)}
          />
        ))}
      </div>
    </div>
  );
}
