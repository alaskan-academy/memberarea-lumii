"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X, Check } from "lucide-react";
import type { PlanoGerado } from "@/lib/ferramentas/support-plan/types";
import { updateSupportPlan, deleteSupportPlan } from "@/lib/ferramentas/support-plan/actions";
import PlanSummary from "./PlanSummary";
import EditablePlanFields from "./EditablePlanFields";

export default function PlanCard({
  planId,
  planoGerado,
  planLabel,
  onDeleted,
}: {
  planId: string;
  planoGerado: PlanoGerado;
  planLabel: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlanoGerado>(planoGerado);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEdit() {
    setDraft(planoGerado);
    setError(null);
    setEditing(true);
  }

  function handleCancel() {
    setDraft(planoGerado);
    setError(null);
    setEditing(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateSupportPlan({ plan_id: planId, plano_gerado: draft });
      if (res.error) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Excluir o plano "${planLabel}"? O histórico de check-ins dele também será apagado. Essa ação não pode ser desfeita.`))
      return;
    setError(null);
    startTransition(async () => {
      const res = await deleteSupportPlan(planId);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onDeleted?.();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-1 mb-3">
        {editing ? (
          <>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white bg-[#f6614f] hover:bg-[#e2543f] transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {isPending ? "Salvando..." : "Salvar edição"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleEdit}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:border-[#f6614f] hover:text-[#f6614f] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border text-red-500 hover:border-red-500 hover:bg-red-500/5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {editing ? (
        <EditablePlanFields plano={draft} onChange={setDraft} />
      ) : (
        <PlanSummary plano={planoGerado} />
      )}
    </div>
  );
}
