"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { useModalBackGuard } from "@/hooks/useModalBackGuard";
import { createTeacherStudent, type TeacherStudentRow } from "@/lib/ferramentas/support-plan/actions";

export default function NovoAlunoModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (student: TeacherStudentRow) => void;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [classLabel, setClassLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  useModalBackGuard(open, onClose);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createTeacherStudent({
        name,
        age: age ? Number(age) : null,
        class_label: classLabel || null,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.student) {
        onCreated(res.student);
        setName("");
        setAge("");
        setClassLabel("");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Cadastrar aluno"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Cadastrar aluno</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="novo-aluno-nome" className="text-xs font-medium text-muted-foreground">Nome *</label>
            <input
              id="novo-aluno-nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mt-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f6614f]/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="novo-aluno-idade" className="text-xs font-medium text-muted-foreground">Idade</label>
              <input
                id="novo-aluno-idade"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="opcional"
                className="w-full mt-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f6614f]/40"
              />
            </div>
            <div>
              <label htmlFor="novo-aluno-turma" className="text-xs font-medium text-muted-foreground">Turma</label>
              <input
                id="novo-aluno-turma"
                value={classLabel}
                onChange={(e) => setClassLabel(e.target.value)}
                placeholder="ex: 3º ano B"
                className="w-full mt-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f6614f]/40"
              />
            </div>
          </div>

          {error && <p role="alert" className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="w-full py-2.5 rounded-lg font-semibold text-white bg-[#f6614f] hover:bg-[#e2543f] disabled:opacity-50 transition-colors min-h-[44px]"
          >
            {isPending ? "Salvando..." : "Cadastrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
