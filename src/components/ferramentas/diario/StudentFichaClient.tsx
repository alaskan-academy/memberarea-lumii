"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, BookOpen, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportPlanRow } from "@/lib/ferramentas/support-plan/types";
import type { StudentLogRow } from "@/lib/ferramentas/diario/types";
import PlanTargetDetailClient from "../support-plan/PlanTargetDetailClient";
import DiarioPanel from "./DiarioPanel";

type Aba = "diario" | "plano";

/** Ficha do aluno com abas — o "aluno é o centro" (Bloco 1 do plano). */
export default function StudentFichaClient({
  student,
  plans,
  logs,
  initialTab,
}: {
  student: { id: string; name: string };
  plans: SupportPlanRow[];
  logs: StudentLogRow[];
  initialTab: Aba;
}) {
  const pathname = usePathname();
  const [aba, setAba] = useState<Aba>(initialTab);

  function switchTab(next: Aba) {
    setAba(next);
    // Mantém a aba na URL (sem navegar) para deep-link e voltar do navegador.
    if (typeof window !== "undefined") {
      const url = next === "diario" ? pathname : `${pathname}?aba=plano`;
      window.history.replaceState(null, "", url);
    }
  }

  const planCount = plans.length;

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

      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          type="button"
          onClick={() => switchTab("diario")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
            aba === "diario"
              ? "border-lumii-coral text-lumii-coral"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Diário
        </button>
        <button
          type="button"
          onClick={() => switchTab("plano")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
            aba === "plano"
              ? "border-lumii-coral text-lumii-coral"
              : "border-transparent text-muted-foreground hover:text-foreground"
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
      </div>

      {aba === "diario" ? (
        <DiarioPanel studentId={student.id} studentName={student.name} initialLogs={logs} />
      ) : (
        <PlanTargetDetailClient
          target={{ kind: "aluno", id: student.id, name: student.name }}
          plans={plans}
          embedded
        />
      )}
    </div>
  );
}
