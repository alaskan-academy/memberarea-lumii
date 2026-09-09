"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LayoutGrid, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { tierAtLeast, type Tier } from "@/lib/access/tier";
import type { TeacherStudentRow, TeacherClassRow } from "@/lib/ferramentas/support-plan/actions";
import StudentListSection from "./StudentListSection";
import ClassListSection from "./ClassListSection";

type Aba = "aluno" | "turma";

export default function PlanoApoioHub({
  initialStudents,
  initialClasses,
  tier,
}: {
  initialStudents: TeacherStudentRow[];
  initialClasses: TeacherClassRow[];
  tier: Tier;
}) {
  const [aba, setAba] = useState<Aba>("aluno");
  const temCompleto = tierAtLeast(tier, "completo");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href="/ferramentas"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Ferramentas
      </Link>

      <div className="mb-4">
        <h1 className="text-2xl font-bold">Meus Alunos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cada aluno tem diário de bordo e planos de apoio — o histórico do ano num lugar só.
          Planos também podem ser feitos para a turma toda.
        </p>
      </div>

      {/* Mapa da turma — visão agregada (Lumii Completo) */}
      <Link
        href="/ferramentas/meus-alunos/mapa"
        className="lumii-card p-3.5 mb-6 flex items-center gap-3 hover:border-lumii-coral/40 transition-colors group"
      >
        <div className="w-9 h-9 rounded-lg bg-lumii-coral/12 flex items-center justify-center shrink-0">
          <LayoutGrid className="w-4 h-4 text-lumii-coral" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            Mapa da turma
            {!temCompleto && <Lock className="w-3 h-3 text-lumii-yellow" />}
          </p>
          <p className="text-xs text-muted-foreground">Todos os alunos num relance — para o conselho</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-lumii-coral transition-colors shrink-0" />
      </Link>

      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          type="button"
          onClick={() => setAba("aluno")}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
            aba === "aluno"
              ? "border-lumii-coral text-lumii-coral"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Por aluno
        </button>
        <button
          type="button"
          onClick={() => setAba("turma")}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
            aba === "turma"
              ? "border-lumii-coral text-lumii-coral"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Por turma
        </button>
      </div>

      {aba === "aluno" ? (
        <StudentListSection initialStudents={initialStudents} />
      ) : (
        <ClassListSection initialClasses={initialClasses} />
      )}
    </div>
  );
}
