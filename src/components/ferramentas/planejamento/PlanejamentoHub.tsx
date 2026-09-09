"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Library, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonResourceRow } from "@/lib/ferramentas/planejamento/types";
import type { RubricRow, RubricScoreRow } from "@/lib/ferramentas/planejamento/rubricas/types";
import BibliotecaSection from "./BibliotecaSection";
import RubricasSection from "./rubricas/RubricasSection";

type Aba = "biblioteca" | "rubricas";

export default function PlanejamentoHub({
  resources,
  rubrics,
  scores,
  students,
  initialTab,
}: {
  resources: LessonResourceRow[];
  rubrics: RubricRow[];
  scores: RubricScoreRow[];
  students: { id: string; name: string }[];
  initialTab: Aba;
}) {
  const pathname = usePathname();
  const [aba, setAba] = useState<Aba>(initialTab);

  function switchTab(next: Aba) {
    setAba(next);
    if (typeof window !== "undefined") {
      const url = next === "biblioteca" ? pathname : `${pathname}?aba=rubricas`;
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
        Material reutilizável — sua biblioteca e suas rubricas de avaliação.
      </p>

      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          type="button"
          onClick={() => switchTab("biblioteca")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
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
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
            aba === "rubricas" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ClipboardList className="w-4 h-4" />
          Rubricas
        </button>
      </div>

      {aba === "biblioteca" ? (
        <BibliotecaSection resources={resources} />
      ) : (
        <RubricasSection rubrics={rubrics} scores={scores} students={students} />
      )}
    </div>
  );
}
