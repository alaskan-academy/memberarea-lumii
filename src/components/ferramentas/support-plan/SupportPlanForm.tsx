"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DIFICULDADES,
  TAMBEM_APRESENTA_CHIPS,
  type DificuldadePrincipal,
} from "@/lib/ferramentas/support-plan/types";
import type { SupportPlanInput } from "@/lib/ferramentas/support-plan/types";

export default function SupportPlanForm({
  onGenerate,
}: {
  onGenerate: (input: Omit<SupportPlanInput, "student_id">) => void;
}) {
  const [dificuldade, setDificuldade] = useState<DificuldadePrincipal | null>(null);
  const [outro, setOutro] = useState("");
  const [tambemApresenta, setTambemApresenta] = useState<string[]>([]);
  const [pontoForte, setPontoForte] = useState("");
  const [jaTentei, setJaTentei] = useState("");
  const [sugerirCoordenacao, setSugerirCoordenacao] = useState(false);

  function toggleChip(chip: string) {
    setTambemApresenta((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  }

  const podeGerar = !!dificuldade && (dificuldade !== "outro" || outro.trim().length > 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dificuldade || !podeGerar) return;
    onGenerate({
      dificuldade_principal: dificuldade,
      dificuldade_principal_outro: dificuldade === "outro" ? outro.trim() : undefined,
      tambem_apresenta: tambemApresenta,
      ponto_forte: pontoForte.trim() || undefined,
      ja_tentei: jaTentei.trim() || undefined,
      sugerir_coordenacao: sugerirCoordenacao,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-semibold mb-2 block">Qual a dificuldade principal?</label>
        <div className="grid grid-cols-2 gap-2">
          {DIFICULDADES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDificuldade(d.value)}
              className={cn(
                "text-left text-sm px-3 py-2.5 rounded-lg border transition-colors",
                dificuldade === d.value
                  ? "border-[#f6614f] bg-[#f6614f]/10 text-[#f6614f] font-semibold"
                  : "border-border hover:border-[#f6614f]/50"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        {dificuldade === "outro" && (
          <input
            value={outro}
            onChange={(e) => setOutro(e.target.value)}
            placeholder="Descreva rapidamente a dificuldade..."
            className="w-full mt-2 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f6614f]/40"
          />
        )}
      </div>

      <div>
        <label className="text-sm font-semibold mb-2 block">
          Também apresenta <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TAMBEM_APRESENTA_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => toggleChip(chip)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-colors",
                tambemApresenta.includes(chip)
                  ? "border-[#eebc3e] bg-[#eebc3e]/15 text-[#a97e1a] font-semibold"
                  : "border-border text-muted-foreground hover:border-[#eebc3e]/50"
              )}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold mb-1.5 block">
          Ponto forte do aluno <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          value={pontoForte}
          onChange={(e) => setPontoForte(e.target.value)}
          rows={2}
          placeholder="Ex: é muito criativo, ajuda os colegas..."
          className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f6614f]/40 resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-semibold mb-1.5 block">
          O que já foi tentado <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          value={jaTentei}
          onChange={(e) => setJaTentei(e.target.value)}
          rows={2}
          placeholder="Ex: conversei com a família, mudei o lugar dele na sala..."
          className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f6614f]/40 resize-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={sugerirCoordenacao}
          onChange={(e) => setSugerirCoordenacao(e.target.checked)}
          className="w-4 h-4 accent-[#f6614f]"
        />
        Incluir sugestão de conversar com a coordenação pedagógica
      </label>

      <button
        type="submit"
        disabled={!podeGerar}
        className="w-full py-3 rounded-xl font-semibold text-white bg-[#f6614f] hover:bg-[#e2543f] disabled:opacity-50 transition-colors min-h-[44px]"
      >
        Gerar plano
      </button>
    </form>
  );
}
