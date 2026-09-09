"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Library, ClipboardList, CalendarRange, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { tierAtLeast, type Tier } from "@/lib/access/tier";
import type { LessonResourceRow } from "@/lib/ferramentas/planejamento/types";
import type { RubricRow, RubricScoreRow } from "@/lib/ferramentas/planejamento/rubricas/types";
import type { YearPlanRow } from "@/lib/ferramentas/planejamento/bncc/types";
import BibliotecaSection from "./BibliotecaSection";
import RubricasSection from "./rubricas/RubricasSection";
import PlanejadorSection from "./bncc/PlanejadorSection";

type Aba = "biblioteca" | "rubricas" | "planejador";

export default function PlanejamentoHub({
  resources,
  rubrics,
  scores,
  students,
  yearPlans,
  tier,
  initialTab,
}: {
  resources: LessonResourceRow[];
  rubrics: RubricRow[];
  scores: RubricScoreRow[];
  students: { id: string; name: string }[];
  yearPlans: YearPlanRow[];
  tier: Tier;
  initialTab: Aba;
}) {
  const pathname = usePathname();
  const [aba, setAba] = useState<Aba>(initialTab);
  const temCompleto = tierAtLeast(tier, "completo");

  function switchTab(next: Aba) {
    setAba(next);
    if (typeof window !== "undefined") {
      const url = next === "biblioteca" ? pathname : `${pathname}?aba=${next}`;
      window.history.replaceState(null, "", url);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href="/ferramentas"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Ferramentas
      </Link>

      <h1 className="text-2xl font-bold">Planejamento</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Material reutilizável — biblioteca, rubricas e o planejador do ano.
      </p>

      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => switchTab("biblioteca")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
            aba === "biblioteca" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Library className="w-4 h-4" />
          Biblioteca
        </button>
        <button
          type="button"
          onClick={() => switchTab("rubricas")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
            aba === "rubricas" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ClipboardList className="w-4 h-4" />
          Rubricas
        </button>
        <button
          type="button"
          onClick={() => switchTab("planejador")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
            aba === "planejador" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarRange className="w-4 h-4" />
          Planejador BNCC
          {!temCompleto && <Lock className="w-3 h-3 text-lumii-yellow" />}
        </button>
      </div>

      {aba === "biblioteca" && <BibliotecaSection resources={resources} />}
      {aba === "rubricas" && <RubricasSection rubrics={rubrics} scores={scores} students={students} />}
      {aba === "planejador" && <PlanejadorSection plans={yearPlans} temCompleto={temCompleto} />}
    </div>
  );
}
