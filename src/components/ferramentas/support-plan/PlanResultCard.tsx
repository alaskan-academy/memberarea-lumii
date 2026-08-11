"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Target, PlayCircle, Repeat, XCircle, Eye, MessageCircle } from "lucide-react";
import type { PlanoGerado, SupportPlanInput } from "@/lib/ferramentas/support-plan/types";
import { saveSupportPlan } from "@/lib/ferramentas/support-plan/actions";

function Field({
  icon: Icon,
  label,
  color,
  value,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-1.5"
        style={{ color }}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f6614f]/40 resize-none"
      />
    </div>
  );
}

export default function PlanResultCard({
  studentId,
  input,
  draft,
}: {
  studentId: string;
  input: Omit<SupportPlanInput, "student_id">;
  draft: PlanoGerado;
}) {
  const router = useRouter();
  const [plano, setPlano] = useState<PlanoGerado>(draft);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof PlanoGerado>(key: K, value: PlanoGerado[K]) {
    setPlano((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveSupportPlan({
        student_id: studentId,
        dificuldade_principal: input.dificuldade_principal,
        dificuldade_principal_outro: input.dificuldade_principal_outro,
        tambem_apresenta: input.tambem_apresenta,
        ponto_forte: input.ponto_forte,
        ja_tentei: input.ja_tentei,
        plano_gerado: plano,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push(`/ferramentas/plano-apoio-aluno/${studentId}`);
    });
  }

  return (
    <div className="lumii-card p-5 sm:p-6 space-y-5">
      <p className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">
        Revise e ajuste o texto abaixo antes de salvar — ele já considera a dificuldade
        selecionada, mas você conhece o aluno melhor que qualquer modelo pronto.
      </p>

      <Field
        icon={Target}
        label="Objetivo das próximas 2 semanas"
        color="#71c69a"
        value={plano.objetivo}
        onChange={(v) => update("objetivo", v)}
      />
      <Field
        icon={PlayCircle}
        label="Antes da atividade"
        color="#f6614f"
        value={plano.antes_da_atividade}
        onChange={(v) => update("antes_da_atividade", v)}
      />
      <Field
        icon={PlayCircle}
        label="Durante"
        color="#f6614f"
        value={plano.durante}
        onChange={(v) => update("durante", v)}
      />
      <Field
        icon={Repeat}
        label="Se houver recusa"
        color="#eebc3e"
        value={plano.se_houver_recusa}
        onChange={(v) => update("se_houver_recusa", v)}
      />
      <Field
        icon={Eye}
        label="O que observar"
        color="#6699F3"
        value={plano.o_que_observar}
        onChange={(v) => update("o_que_observar", v)}
      />

      {plano.sugestao_coordenacao !== null && (
        <div className="rounded-xl bg-[#6699F3]/5 border border-[#6699F3]/20 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#6699F3] mb-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            Vale conversar com a coordenação
          </p>
          <textarea
            value={plano.sugestao_coordenacao}
            onChange={(e) => update("sugestao_coordenacao", e.target.value)}
            rows={2}
            className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6699F3]/40 resize-none"
          />
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-500">
          <XCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-3 rounded-xl font-semibold text-white bg-[#f6614f] hover:bg-[#e2543f] disabled:opacity-50 transition-colors min-h-[44px]"
      >
        {isPending ? "Salvando..." : "Salvar plano"}
      </button>
    </div>
  );
}
