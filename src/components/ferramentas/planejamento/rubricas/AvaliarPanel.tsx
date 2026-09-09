"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import {
  corDoNivel,
  type RubricRow,
  type RubricScoreRow,
} from "@/lib/ferramentas/planejamento/rubricas/types";
import { saveScore, deleteScore } from "@/lib/ferramentas/planejamento/rubricas/actions";
import AutoGrowTextarea from "../../support-plan/AutoGrowTextarea";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AvaliarPanel({
  rubric,
  students,
  scores,
}: {
  rubric: RubricRow;
  students: { id: string; name: string }[];
  scores: RubricScoreRow[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [niveis, setNiveis] = useState<Record<string, number>>({});
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function marcar(critId: string, nivel: number) {
    setNiveis((prev) => ({ ...prev, [critId]: nivel }));
  }

  function handleSave() {
    if (!studentId) return setError("Escolha um aluno");
    if (Object.keys(niveis).length === 0) return setError("Marque ao menos um critério");
    setError(null);
    startTransition(async () => {
      const res = await saveScore({ rubric_id: rubric.id, student_id: studentId, niveis, comentario });
      if (res.error) {
        setError(res.error);
        return;
      }
      setNiveis({});
      setComentario("");
      setStudentId("");
      router.refresh();
    });
  }

  function excluirScore(id: string) {
    startTransition(async () => {
      const res = await deleteScore(id);
      if (!res.error) router.refresh();
    });
  }

  const semAlunos = students.length === 0;

  return (
    <div className="space-y-5">
      {/* Formulário de avaliação */}
      <div className="lumii-card p-4 sm:p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-foreground/80 block mb-1.5">Avaliar aluno</label>
          {semAlunos ? (
            <p className="text-sm text-muted-foreground">
              Cadastre alunos em <span className="font-medium">Meus Alunos</span> para poder avaliá-los.
            </p>
          ) : (
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
            >
              <option value="">Escolha um aluno…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {!semAlunos && (
          <>
            <div className="space-y-3">
              {rubric.itens.map((crit) => (
                <div key={crit.id}>
                  <p className="text-sm font-medium text-foreground mb-1.5">{crit.nome}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rubric.escala.map((nivel, idx) => {
                      const ativo = niveis[crit.id] === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => marcar(crit.id, idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] border ${
                            ativo
                              ? `${corDoNivel(idx, rubric.escala.length)} border-current`
                              : "bg-white text-foreground/60 border-border hover:border-lumii-coral/40"
                          }`}
                        >
                          {nivel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">Comentário (opcional)</label>
              <AutoGrowTextarea
                value={comentario}
                onChange={setComentario}
                placeholder="Observações sobre esta avaliação…"
                maxLength={1000}
                maxHeight={200}
                className="bg-white"
              />
            </div>

            {error && <p role="alert" className="text-xs text-red-500">{error}</p>}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || !studentId}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[40px] disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Salvar avaliação
              </button>
            </div>
          </>
        )}
      </div>

      {/* Avaliações feitas */}
      {scores.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-sm font-semibold text-muted-foreground">Avaliações feitas ({scores.length})</p>
          {scores.map((sc) => (
            <div key={sc.id} className="lumii-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{sc.studentName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(sc.created_at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => excluirScore(sc.id)}
                  disabled={isPending}
                  aria-label="Excluir avaliação"
                  className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-2 space-y-1.5">
                {rubric.itens.map((crit) => {
                  const nivel = sc.niveis[crit.id];
                  if (nivel === undefined) return null;
                  return (
                    <div key={crit.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-foreground/80 min-w-0 truncate">{crit.nome}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${corDoNivel(nivel, rubric.escala.length)}`}>
                        {rubric.escala[nivel] ?? "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
              {sc.comentario && <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap break-words">{sc.comentario}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
