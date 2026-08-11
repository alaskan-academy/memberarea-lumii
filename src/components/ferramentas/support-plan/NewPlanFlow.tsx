"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { SupportPlanInput } from "@/lib/ferramentas/support-plan/types";
import { buildSupportPlanDraft } from "@/lib/ferramentas/support-plan/draft";
import SupportPlanForm from "./SupportPlanForm";
import PlanResultCard from "./PlanResultCard";

export default function NewPlanFlow({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [input, setInput] = useState<Omit<SupportPlanInput, "student_id"> | null>(null);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href={`/ferramentas/plano-apoio-aluno/${studentId}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        {studentName}
      </Link>

      <h1 className="text-xl font-bold mb-1">Novo plano de apoio</h1>
      <p className="text-sm text-muted-foreground mb-6">para {studentName}</p>

      {!input ? (
        <SupportPlanForm onGenerate={setInput} />
      ) : (
        <PlanResultCard
          studentId={studentId}
          input={input}
          draft={buildSupportPlanDraft({ student_id: studentId, ...input })}
        />
      )}
    </div>
  );
}
