"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { bimestreLabel, type YearPlanRow } from "@/lib/ferramentas/planejamento/bncc/types";
import { deleteYearPlan } from "@/lib/ferramentas/planejamento/bncc/actions";

export default function YearPlanCard({ plan, onEdit }: { plan: YearPlanRow; onEdit: (p: YearPlanRow) => void }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const temTexto = plan.texto.trim().length > 0;
  const longo = plan.texto.length > 220;

  function copiar() {
    const codes = plan.bncc_codes.length ? `\nBNCC: ${plan.bncc_codes.join(", ")}` : "";
    navigator.clipboard
      .writeText(`${plan.titulo}${codes}\n\n${plan.texto}`.trim())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  }

  function excluir() {
    setError(null);
    startTransition(async () => {
      const res = await deleteYearPlan(plan.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="lumii-card p-4">
      <div className="flex items-center gap-2 flex-wrap">
        {plan.componente && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-lumii-coral/12 text-lumii-coral">{plan.componente}</span>
        )}
        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground/60">
          {plan.ano} · {bimestreLabel(plan.bimestre)}
        </span>
      </div>
      <h3 className="font-semibold text-foreground mt-1.5 break-words">{plan.titulo}</h3>

      {plan.bncc_codes.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {plan.bncc_codes.map((c) => (
            <span key={c} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/12 text-primary">{c}</span>
          ))}
        </div>
      )}

      {temTexto && (
        <div className="mt-2.5">
          <p className={`text-sm text-foreground/85 whitespace-pre-wrap break-words ${expanded || !longo ? "" : "line-clamp-3"}`}>{plan.texto}</p>
          {longo && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="inline-flex items-center gap-1 text-xs font-medium text-lumii-coral hover:underline mt-1">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Recolher" : "Ver tudo"}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
        <button type="button" onClick={() => onEdit(plan)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Editar
        </button>
        {temTexto && (
          <button type="button" onClick={copiar} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        )}
        <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Excluir planejamento" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors ml-auto">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {confirmDelete && (
        <div className="mt-2 flex items-center gap-2 text-xs bg-red-50 text-red-700 rounded-lg px-3 py-2">
          <span className="flex-1">Excluir este planejamento? Não dá para desfazer.</span>
          <button type="button" onClick={() => setConfirmDelete(false)} disabled={isPending} className="px-2 py-1 rounded hover:bg-red-100 disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={excluir} disabled={isPending} className="px-2 py-1 rounded bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50">Excluir</button>
        </div>
      )}
      {error && <p role="alert" className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
