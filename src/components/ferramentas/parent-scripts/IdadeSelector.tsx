"use client";

import { useState } from "react";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import type { Situacao } from "@/lib/ferramentas/parent-scripts/types";
import { SITUACOES } from "@/lib/ferramentas/parent-scripts/types";

export default function IdadeSelector({
  situacao,
  onBack,
  onConfirm,
}: {
  situacao: Situacao;
  onBack: () => void;
  onConfirm: (idade: number) => void;
}) {
  const [idade, setIdade] = useState(5);
  const label = SITUACOES.find((s) => s.value === situacao)?.label ?? "";

  function clamp(v: number) {
    return Math.min(17, Math.max(0, v));
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Trocar situação
      </button>

      <h2 className="text-lg font-bold mb-1">{label}</h2>
      <p className="text-sm text-muted-foreground mb-5">Quantos anos a criança tem?</p>

      <div className="lumii-card p-6 flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Diminuir idade"
          onClick={() => setIdade((v) => clamp(v - 1))}
          className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:border-[#f6614f] hover:text-[#f6614f] transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="text-center min-w-[70px]">
          <span className="text-4xl font-black">{idade}</span>
          <p className="text-xs text-muted-foreground mt-1">{idade === 1 ? "ano" : "anos"}</p>
        </div>
        <button
          type="button"
          aria-label="Aumentar idade"
          onClick={() => setIdade((v) => clamp(v + 1))}
          className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:border-[#f6614f] hover:text-[#f6614f] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onConfirm(idade)}
        className="w-full mt-5 py-3 rounded-xl font-semibold text-white bg-[#f6614f] hover:bg-[#e2543f] transition-colors min-h-[44px]"
      >
        Ver o que dizer
      </button>
    </div>
  );
}
