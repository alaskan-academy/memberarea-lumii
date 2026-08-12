"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import type { TeacherClassRow } from "@/lib/ferramentas/support-plan/actions";
import ClassCard from "./ClassCard";
import NovaTurmaModal from "./NovaTurmaModal";

export default function ClassListSection({
  initialClasses,
}: {
  initialClasses: TeacherClassRow[];
}) {
  const [classes, setClasses] = useState(initialClasses);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border hover:border-[#f6614f] text-sm font-semibold text-muted-foreground hover:text-[#f6614f] transition-colors min-h-[44px]"
      >
        <Users className="w-4 h-4" />
        Cadastrar turma
      </button>

      {classes.length === 0 ? (
        <div className="lumii-card p-6 text-center space-y-2">
          <p className="text-2xl">🏫</p>
          <p className="font-semibold">Nenhuma turma cadastrada ainda</p>
          <p className="text-sm text-muted-foreground">
            Use quando a dificuldade é coletiva — a turma toda, não um aluno específico.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {classes.map((c) => (
            <ClassCard key={c.id} teacherClass={c} />
          ))}
        </div>
      )}

      <NovaTurmaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(teacherClass) => {
          setClasses((prev) => [teacherClass, ...prev]);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
