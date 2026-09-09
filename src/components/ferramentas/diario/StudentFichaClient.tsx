"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, BookOpen, ClipboardList, FileText, Lock, Target, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { tierAtLeast, type Tier } from "@/lib/access/tier";
import type { SupportPlanRow } from "@/lib/ferramentas/support-plan/types";
import type { StudentLogRow } from "@/lib/ferramentas/diario/types";
import type { StudentRubricScore } from "@/lib/ferramentas/planejamento/rubricas/types";
import type { GoalRow } from "@/lib/ferramentas/metas/types";
import type { PortfolioItem } from "@/lib/ferramentas/portfolio/types";
import PlanTargetDetailClient from "../support-plan/PlanTargetDetailClient";
import DiarioPanel from "./DiarioPanel";
import RelatorioAluno from "./RelatorioAluno";
import RelatorioLocked from "./RelatorioLocked";
import MetasPanel from "../metas/MetasPanel";
import PortfolioPanel from "../portfolio/PortfolioPanel";

type Aba = "diario" | "plano" | "metas" | "portfolio" | "relatorio";

/** Ficha do aluno com abas — o "aluno é o centro" (Bloco 1 do plano). */
export default function StudentFichaClient({
  student,
  plans,
  logs,
  goals,
  portfolioItems,
  tier,
  reportScores,
  initialTab,
}: {
  student: { id: string; name: string };
  plans: SupportPlanRow[];
  logs: StudentLogRow[];
  goals: GoalRow[];
  portfolioItems: PortfolioItem[];
  tier: Tier;
  reportScores: StudentRubricScore[];
  initialTab: Aba;
}) {
  const pathname = usePathname();
  const [aba, setAba] = useState<Aba>(initialTab);

  const temCompleto = tierAtLeast(tier, "completo");

  function switchTab(next: Aba) {
    setAba(next);
    // Mantém a aba na URL (sem navegar) para deep-link e voltar do navegador.
    if (typeof window !== "undefined") {
      const url = next === "diario" ? pathname : `${pathname}?aba=${next}`;
      window.history.replaceState(null, "", url);
    }
  }

  const planCount = plans.length;
  const goalCount = goals.filter((g) => g.status === "em_andamento").length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href="/ferramentas/meus-alunos"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Meus alunos
      </Link>

      <h1 className="text-2xl font-bold mb-6">{student.name}</h1>

      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => switchTab("diario")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
            aba === "diario" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Diário
        </button>
        <button
          type="button"
          onClick={() => switchTab("plano")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
            aba === "plano" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ClipboardList className="w-4 h-4" />
          Plano de apoio
          {planCount > 0 && (
            <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-muted text-foreground/60 text-[10px] font-bold flex items-center justify-center px-1">
              {planCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => switchTab("metas")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
            aba === "metas" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Target className="w-4 h-4" />
          Metas
          {goalCount > 0 && (
            <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-muted text-foreground/60 text-[10px] font-bold flex items-center justify-center px-1">
              {goalCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => switchTab("portfolio")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
            aba === "portfolio" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ImageIcon className="w-4 h-4" />
          Portfólio
          {portfolioItems.length > 0 && (
            <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-muted text-foreground/60 text-[10px] font-bold flex items-center justify-center px-1">
              {portfolioItems.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => switchTab("relatorio")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
            aba === "relatorio" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="w-4 h-4" />
          Relatório
          {!temCompleto && <Lock className="w-3 h-3 text-lumii-yellow" />}
        </button>
      </div>

      {aba === "diario" && (
        <DiarioPanel studentId={student.id} studentName={student.name} initialLogs={logs} />
      )}
      {aba === "plano" && (
        <PlanTargetDetailClient target={{ kind: "aluno", id: student.id, name: student.name }} plans={plans} embedded />
      )}
      {aba === "metas" && (
        <MetasPanel studentId={student.id} studentName={student.name} initialGoals={goals} />
      )}
      {aba === "portfolio" && (
        <PortfolioPanel studentId={student.id} studentName={student.name} initialItems={portfolioItems} />
      )}
      {aba === "relatorio" &&
        (temCompleto ? (
          <RelatorioAluno student={{ name: student.name }} logs={logs} plans={plans} goals={goals} scores={reportScores} />
        ) : (
          <RelatorioLocked studentName={student.name} />
        ))}
    </div>
  );
}
