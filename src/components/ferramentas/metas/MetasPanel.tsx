"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target } from "lucide-react";
import { GOAL_AREAS, type GoalArea, type GoalRow } from "@/lib/ferramentas/metas/types";
import { createGoal } from "@/lib/ferramentas/metas/actions";
import AutoGrowTextarea from "../support-plan/AutoGrowTextarea";
import GoalCard from "./GoalCard";

export default function MetasPanel({
  studentId,
  studentName,
  initialGoals,
}: {
  studentId: string;
  studentName: string;
  initialGoals: GoalRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState<GoalArea>("convivencia");
  const [meta, setMeta] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Metas em aberto primeiro; alcançadas/pausadas depois.
  const ativas = initialGoals.filter((g) => g.status === "em_andamento");
  const outras = initialGoals.filter((g) => g.status !== "em_andamento");

  function handleCreate() {
    if (!meta.trim()) {
      setError("Descreva a meta");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createGoal({ student_id: studentId, area, meta: meta.trim() });
      if (res.error) {
        setError(res.error);
        return;
      }
      setMeta("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Metas socioemocionais de {studentName.split(" ")[0]} — acompanhe o progresso ao longo do ano.
        </p>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-white bg-lumii-coral hover:bg-lumii-coral-hover transition-colors min-h-[40px] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="sr-only sm:not-sr-only">Nova meta</span>
          </button>
        )}
      </div>

      {open && (
        <div className="lumii-card p-4 sm:p-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">Nova meta</p>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_AREAS.map((a) => {
              const active = area === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setArea(a.value)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all min-h-[34px] ${
                    active ? `${a.chip} ring-2 ring-offset-1 ring-current` : "bg-muted/60 text-foreground/60 hover:bg-muted"
                  }`}
                >
                  <span aria-hidden>{a.emoji}</span>
                  {a.label}
                </button>
              );
            })}
          </div>
          <AutoGrowTextarea
            value={meta}
            onChange={setMeta}
            placeholder="ex.: Esperar a vez de falar nas rodas de conversa."
            maxLength={500}
            maxHeight={160}
            className="bg-white"
          />
          {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setOpen(false); setMeta(""); setError(null); }} disabled={isPending} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors min-h-[40px] disabled:opacity-50">
              Cancelar
            </button>
            <button type="button" onClick={handleCreate} disabled={isPending || !meta.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-lumii-coral hover:bg-lumii-coral-hover transition-colors min-h-[40px] disabled:opacity-50">
              <Plus className="w-4 h-4" />
              Criar meta
            </button>
          </div>
        </div>
      )}

      {initialGoals.length === 0 && !open ? (
        <div className="text-center py-10 text-muted-foreground">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhuma meta ainda.</p>
          <p className="text-xs mt-1">Defina uma meta socioemocional e acompanhe com check-ins.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ativas.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
          {outras.length > 0 && (
            <>
              {ativas.length > 0 && <p className="text-xs font-semibold text-muted-foreground pt-2">Concluídas / pausadas</p>}
              {outras.map((g) => (
                <GoalCard key={g.id} goal={g} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
