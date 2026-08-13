"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import {
  DISCLAIMER_SUPPORT_PLAN,
  type PlanoGerado,
  type PlanTarget,
  type SupportPlanInput,
} from "@/lib/ferramentas/support-plan/types";
import { saveSupportPlan } from "@/lib/ferramentas/support-plan/actions";
import EditablePlanFields from "./EditablePlanFields";

export default function PlanResultCard({
  target,
  input,
  draft,
}: {
  target: PlanTarget;
  input: SupportPlanInput;
  draft: PlanoGerado;
}) {
  const router = useRouter();
  const [plano, setPlano] = useState<PlanoGerado>(draft);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveSupportPlan({
        student_id: target.kind === "aluno" ? target.id : undefined,
        class_id: target.kind === "turma" ? target.id : undefined,
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
      router.push(
        target.kind === "aluno"
          ? `/ferramentas/plano-apoio-aluno/aluno/${target.id}`
          : `/ferramentas/plano-apoio-aluno/turma/${target.id}`
      );
    });
  }

  return (
    <div className="lumii-card p-5 sm:p-6 space-y-5">
      <p className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">
        Revise e ajuste o texto abaixo antes de salvar — ele já considera a dificuldade
        selecionada, mas você conhece {target.kind === "turma" ? "a turma" : "o aluno"} melhor
        que qualquer modelo pronto.
      </p>

      <EditablePlanFields plano={plano} onChange={setPlano} />

      <p className="text-xs text-muted-foreground border-t border-border/60 pt-4">
        {DISCLAIMER_SUPPORT_PLAN}
      </p>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-red-500">
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
