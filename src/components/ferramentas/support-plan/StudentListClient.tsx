"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, UserPlus } from "lucide-react";
import type { TeacherStudentRow } from "@/lib/ferramentas/support-plan/actions";
import StudentCard from "./StudentCard";
import NovoAlunoModal from "./NovoAlunoModal";

export default function StudentListClient({
  initialStudents,
}: {
  initialStudents: TeacherStudentRow[];
}) {
  const [students, setStudents] = useState(initialStudents);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href="/ferramentas"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Ferramentas
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Plano Individual de Apoio ao Aluno</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {students.length > 0 ? "Selecione um aluno para ver ou criar um plano" : "Cadastre seu primeiro aluno para começar"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border hover:border-[#f6614f] text-sm font-semibold text-muted-foreground hover:text-[#f6614f] transition-colors min-h-[44px]"
      >
        <UserPlus className="w-4 h-4" />
        Cadastrar aluno
      </button>

      {students.length === 0 ? (
        <div className="lumii-card p-6 text-center space-y-2">
          <p className="text-2xl">🧑‍🏫</p>
          <p className="font-semibold">Nenhum aluno cadastrado ainda</p>
          <p className="text-sm text-muted-foreground">
            O cadastro é só o essencial: nome, idade e turma — não é o módulo completo de turma.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
        </div>
      )}

      <NovoAlunoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(student) => {
          setStudents((prev) => [student, ...prev]);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
