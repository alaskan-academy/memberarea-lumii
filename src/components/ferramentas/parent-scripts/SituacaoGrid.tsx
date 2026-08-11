"use client";

import { SITUACOES, type Situacao } from "@/lib/ferramentas/parent-scripts/types";

export default function SituacaoGrid({
  onSelect,
}: {
  onSelect: (situacao: Situacao) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Qual é a situação agora?</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SITUACOES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onSelect(s.value)}
            className="lumii-card p-4 flex flex-col items-center gap-2 text-center min-h-[92px] justify-center hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f6614f]"
          >
            <span className="text-2xl" aria-hidden>
              {s.emoji}
            </span>
            <span className="text-sm font-semibold leading-snug">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
