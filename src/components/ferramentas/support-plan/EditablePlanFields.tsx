"use client";

import { Target, PlayCircle, Repeat, Eye, MessageCircle, type LucideIcon } from "lucide-react";
import type { PlanoGerado } from "@/lib/ferramentas/support-plan/types";
import AutoGrowTextarea from "./AutoGrowTextarea";

const FIELDS: {
  key: Exclude<keyof PlanoGerado, "sugestao_coordenacao">;
  label: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { key: "objetivo", label: "Objetivo das próximas 2 semanas", icon: Target, color: "#71c69a" },
  { key: "antes_da_atividade", label: "Antes da atividade", icon: PlayCircle, color: "#f6614f" },
  { key: "durante", label: "Durante", icon: PlayCircle, color: "#f6614f" },
  { key: "se_houver_recusa", label: "Se houver recusa", icon: Repeat, color: "#eebc3e" },
  { key: "o_que_observar", label: "O que observar", icon: Eye, color: "#6699F3" },
];

/** Campos editáveis de um plano — usado tanto na criação (PlanResultCard) quanto na edição (PlanCard). */
export default function EditablePlanFields({
  plano,
  onChange,
}: {
  plano: PlanoGerado;
  onChange: (plano: PlanoGerado) => void;
}) {
  function update<K extends keyof PlanoGerado>(key: K, value: PlanoGerado[K]) {
    onChange({ ...plano, [key]: value });
  }

  return (
    <div className="space-y-5">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <p
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-1.5"
            style={{ color: f.color }}
          >
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
          </p>
          <AutoGrowTextarea value={plano[f.key]} onChange={(v) => update(f.key, v)} />
        </div>
      ))}

      {plano.sugestao_coordenacao !== null && (
        <div className="rounded-xl bg-[#6699F3]/5 border border-[#6699F3]/20 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#6699F3] mb-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            Vale conversar com a coordenação
          </p>
          <AutoGrowTextarea
            value={plano.sugestao_coordenacao}
            onChange={(v) => update("sugestao_coordenacao", v)}
            className="bg-white focus:ring-[#6699F3]/40"
          />
        </div>
      )}
    </div>
  );
}
