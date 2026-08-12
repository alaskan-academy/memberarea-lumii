"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { useModalBackGuard } from "@/hooks/useModalBackGuard";
import { createTeacherClass, type TeacherClassRow } from "@/lib/ferramentas/support-plan/actions";

export default function NovaTurmaModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (teacherClass: TeacherClassRow) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  useModalBackGuard(open, onClose);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createTeacherClass({ name });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.teacherClass) {
        onCreated(res.teacherClass);
        setName("");
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
      aria-label="Cadastrar turma"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Cadastrar turma</h2>
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
            <label className="text-xs font-medium text-muted-foreground">Nome da turma *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="ex: 3º ano B"
              className="w-full mt-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f6614f]/40"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

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
