"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import type { TeacherStudentRow } from "@/lib/ferramentas/support-plan/actions";
import StudentCard from "./StudentCard";
import NovoAlunoModal from "./NovoAlunoModal";

export default function StudentListSection({
  initialStudents,
}: {
  initialStudents: TeacherStudentRow[];
}) {
  const [students, setStudents] = useState(initialStudents);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
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
