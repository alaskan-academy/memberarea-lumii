"use client";

import { useState } from "react";
import { Plus, CalendarRange, Lock } from "lucide-react";
import type { YearPlanRow } from "@/lib/ferramentas/planejamento/bncc/types";
import YearPlanForm from "./YearPlanForm";
import YearPlanCard from "./YearPlanCard";

type FormState = { mode: "new" } | { mode: "edit"; plan: YearPlanRow } | null;

export default function PlanejadorSection({
  plans,
  temCompleto,
}: {
  plans: YearPlanRow[];
  temCompleto: boolean;
}) {
  const [form, setForm] = useState<FormState>(null);

  if (!temCompleto) {
    return (
      <div className="lumii-card p-6 text-center">
        <div className="brand-stripe -mx-6 -mt-6 mb-5"><span /><span /><span /></div>
        <div className="w-12 h-12 rounded-full bg-lumii-coral/12 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-5 h-5 text-lumii-coral" />
        </div>
        <p className="font-bold text-foreground">Planejador BNCC</p>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
          Organize o ano por bimestre, com os códigos de habilidade da BNCC — e reuse ano após ano.
        </p>
        <p className="inline-flex items-center gap-1.5 mt-5 px-3 py-1.5 rounded-full bg-lumii-yellow/15 text-[#8a6410] text-xs font-bold">
          <CalendarRange className="w-3.5 h-3.5" /> Disponível no Lumii Completo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Planeje o ano por bimestre, alinhado à BNCC.</p>
        {!form && (
          <button
            type="button"
            onClick={() => setForm({ mode: "new" })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[40px] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo planejamento</span>
          </button>
        )}
      </div>

      {form && <YearPlanForm initial={form.mode === "edit" ? form.plan : null} onDone={() => setForm(null)} />}

      {plans.length === 0 && !form ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarRange className="w-9 h-9 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground/80">Nenhum planejamento ainda</p>
          <p className="text-xs mt-1 mb-4">Crie o plano de um bimestre com seus objetivos e os códigos da BNCC.</p>
          <button
            type="button"
            onClick={() => setForm({ mode: "new" })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar o primeiro
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <YearPlanCard key={p.id} plan={p} onEdit={(plan) => setForm({ mode: "edit", plan })} />
          ))}
        </div>
      )}
    </div>
  );
}
