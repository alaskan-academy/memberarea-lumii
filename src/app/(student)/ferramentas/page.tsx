import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageCircle, ClipboardList } from "lucide-react";
import FerramentaCard from "@/components/ferramentas/hub/FerramentaCard";
import ToolsProfileBanner from "@/components/ferramentas/hub/ToolsProfileBanner";

export default async function FerramentasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_parent, is_teacher")
    .eq("id", user.id)
    .single();

  const showOnboarding = !profile?.is_parent && !profile?.is_teacher;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-6">
        <p className="text-sm font-medium text-[#f6614f] uppercase tracking-wide mb-1">
          Ferramentas
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold">Tenho essa situação agora</h1>
        <p className="text-muted-foreground mt-1">
          Utilitários rápidos para o dia a dia com crianças — sem precisar ler nada longo.
        </p>
      </div>

      {showOnboarding && <ToolsProfileBanner />}

      <div className="grid sm:grid-cols-2 gap-4">
        <FerramentaCard
          href="/ferramentas/o-que-eu-digo-agora"
          icon={MessageCircle}
          title="O que eu digo agora?"
          subtitle="Conversas difíceis"
          description="Situação + idade da criança → um script pronto para usar na hora, sem enrolação."
          publico="Pais"
        />
        <FerramentaCard
          href="/ferramentas/plano-apoio-aluno"
          icon={ClipboardList}
          title="Plano Individual de Apoio ao Aluno"
          subtitle="Plano de ação por aluno"
          description="Cadastre o aluno, gere um plano de apoio de 2 semanas e acompanhe com check-ins."
          publico="Professores"
        />
      </div>
    </div>
  );
}
