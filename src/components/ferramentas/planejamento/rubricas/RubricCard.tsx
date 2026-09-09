"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Files, Trash2, ClipboardCheck } from "lucide-react";
import { corDoNivel, type RubricRow } from "@/lib/ferramentas/planejamento/rubricas/types";
import { deleteRubric, duplicateRubric } from "@/lib/ferramentas/planejamento/rubricas/actions";

export default function RubricCard({
  rubric,
  scoreCount,
  onEdit,
  onAvaliar,
}: {
  rubric: RubricRow;
  scoreCount: number;
  onEdit: (r: RubricRow) => void;
  onAvaliar: (r: RubricRow) => void;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function duplicar() {
    setError(null);
    startTransition(async () => {
      const res = await duplicateRubric(rubric.id);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  function excluir() {
    setError(null);
    startTransition(async () => {
      const res = await deleteRubric(rubric.id);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="lumii-card p-4">
      <h3 className="font-semibold text-foreground break-words">{rubric.titulo}</h3>

      <div className="flex flex-wrap gap-1 mt-2">
        {rubric.escala.map((nivel, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${corDoNivel(i, rubric.escala.length)}`}>
            {nivel}
          </span>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        {rubric.itens.length} {rubric.itens.length === 1 ? "critério" : "critérios"}
        {scoreCount > 0 && <> · {scoreCount} {scoreCount === 1 ? "avaliação" : "avaliações"}</>}
      </p>

      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
        <button
          type="button"
          onClick={() => onAvaliar(rubric)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-lumii-coral hover:bg-lumii-coral-hover transition-colors"
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          Avaliar
        </button>
        <button type="button" onClick={() => onEdit(rubric)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </button>
        <button type="button" onClick={duplicar} disabled={isPending} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50">
          <Files className="w-3.5 h-3.5" />
          <span className="sr-only sm:not-sr-only">Duplicar</span>
        </button>
        <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Excluir rubrica" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors ml-auto">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {confirmDelete && (
        <div className="mt-2 flex items-center gap-2 text-xs bg-red-50 text-red-700 rounded-lg px-3 py-2">
          <span className="flex-1">
            Excluir a rubrica{scoreCount > 0 ? ` e suas ${scoreCount} avaliações` : ""}? Não dá para desfazer.
          </span>
          <button type="button" onClick={() => setConfirmDelete(false)} disabled={isPending} className="px-2 py-1 rounded hover:bg-red-100 disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={excluir} disabled={isPending} className="px-2 py-1 rounded bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50">
            Excluir
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
