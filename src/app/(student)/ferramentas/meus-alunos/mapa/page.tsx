import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Lock, Users } from "lucide-react";
import { assertToolAccess } from "@/lib/ferramentas/access";
import { getTier } from "@/lib/access/getTier";
import { tierAtLeast } from "@/lib/access/tier";
import { fetchTurmaMapa } from "@/lib/ferramentas/turma-mapa";
import MapaTurmaClient from "@/components/ferramentas/turma/MapaTurmaClient";

export const metadata: Metadata = { title: "Mapa da turma — Lumii" };

export default async function MapaTurmaPage() {
  const { user, supabase } = await assertToolAccess("meus-alunos");
  const tier = await getTier(user.id);

  if (!tierAtLeast(tier, "completo")) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Link href="/ferramentas/meus-alunos" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" />
          Meus alunos
        </Link>
        <div className="lumii-card p-6 text-center">
          <div className="brand-stripe -mx-6 -mt-6 mb-5"><span /><span /><span /></div>
          <div className="w-12 h-12 rounded-full bg-lumii-coral/12 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5 text-lumii-coral" />
          </div>
          <p className="font-bold text-foreground">Mapa da turma</p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
            Veja todos os alunos de uma vez — quem está indo bem e quem precisa de atenção — para preparar o conselho de classe num relance.
          </p>
          <p className="inline-flex items-center gap-1.5 mt-5 px-3 py-1.5 rounded-full bg-lumii-yellow/15 text-[#8a6410] text-xs font-bold">
            <Users className="w-3.5 h-3.5" /> Disponível no Lumii Completo
          </p>
        </div>
      </div>
    );
  }

  const alunos = await fetchTurmaMapa(supabase, user.id);
  return <MapaTurmaClient alunos={alunos} />;
}
