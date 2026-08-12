"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { PlanTarget, SupportPlanInput } from "@/lib/ferramentas/support-plan/types";
import { buildSupportPlanDraft } from "@/lib/ferramentas/support-plan/draft";
import SupportPlanForm from "./SupportPlanForm";
import PlanResultCard from "./PlanResultCard";

export default function NewPlanFlow({ target }: { target: PlanTarget }) {
  const [input, setInput] = useState<SupportPlanInput | null>(null);
  const backHref =
    target.kind === "aluno"
      ? `/ferramentas/plano-apoio-aluno/aluno/${target.id}`
      : `/ferramentas/plano-apoio-aluno/turma/${target.id}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href={backHref}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        {target.name}
      </Link>

      <h1 className="text-xl font-bold mb-1">Novo plano de apoio</h1>
      <p className="text-sm text-muted-foreground mb-6">
        para {target.kind === "turma" ? "a turma" : ""} {target.name}
      </p>

      {!input ? (
        <SupportPlanForm alvo={target.kind} onGenerate={setInput} />
      ) : (
        <PlanResultCard target={target} input={input} draft={buildSupportPlanDraft(input)} />
      )}
    </div>
  );
}
