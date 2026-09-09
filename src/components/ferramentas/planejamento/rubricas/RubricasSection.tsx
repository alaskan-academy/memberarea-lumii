"use client";

import { useMemo, useState } from "react";
import { Plus, ChevronLeft, ClipboardList } from "lucide-react";
import type { RubricRow, RubricScoreRow } from "@/lib/ferramentas/planejamento/rubricas/types";
import RubricForm from "./RubricForm";
import RubricCard from "./RubricCard";
import AvaliarPanel from "./AvaliarPanel";

type View =
  | { mode: "list" }
  | { mode: "form"; rubric: RubricRow | null }
  | { mode: "avaliar"; rubric: RubricRow };

export default function RubricasSection({
  rubrics,
  scores,
  students,
}: {
  rubrics: RubricRow[];
  scores: RubricScoreRow[];
  students: { id: string; name: string }[];
}) {
  const [view, setView] = useState<View>({ mode: "list" });

  const scoreCountByRubric = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of scores) m.set(s.rubric_id, (m.get(s.rubric_id) ?? 0) + 1);
    return m;
  }, [scores]);

  if (view.mode === "form") {
    return (
      <RubricForm
        initial={view.rubric}
        scoreCount={view.rubric ? scoreCountByRubric.get(view.rubric.id) ?? 0 : 0}
        onDone={() => setView({ mode: "list" })}
      />
    );
  }

  if (view.mode === "avaliar") {
    const doRubrica = scores.filter((s) => s.rubric_id === view.rubric.id);
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setView({ mode: "list" })}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Rubricas
        </button>
        <div>
          <p className="text-xs font-semibold text-lumii-coral uppercase tracking-wide">Avaliar com</p>
          <h2 className="text-lg font-bold text-foreground">{view.rubric.titulo}</h2>
        </div>
        <AvaliarPanel rubric={view.rubric} students={students} scores={doRubrica} />
      </div>
    );
  }

  const vazio = rubrics.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Monte a rubrica uma vez e aplique a cada aluno.
        </p>
        <button
          type="button"
          onClick={() => setView({ mode: "form", rubric: null })}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-white bg-lumii-coral hover:bg-lumii-coral-hover transition-colors min-h-[40px] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="sr-only sm:not-sr-only">Nova rubrica</span>
        </button>
      </div>

      {vazio ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-9 h-9 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground/80">Nenhuma rubrica ainda</p>
          <p className="text-xs mt-1 mb-4">
            Crie uma rubrica de avaliação com seus critérios e níveis — depois aplique a cada aluno.
          </p>
          <button
            type="button"
            onClick={() => setView({ mode: "form", rubric: null })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-white bg-lumii-coral hover:bg-lumii-coral-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar a primeira
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rubrics.map((r) => (
            <RubricCard
              key={r.id}
              rubric={r}
              scoreCount={scoreCountByRubric.get(r.id) ?? 0}
              onEdit={(rub) => setView({ mode: "form", rubric: rub })}
              onAvaliar={(rub) => setView({ mode: "avaliar", rubric: rub })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
