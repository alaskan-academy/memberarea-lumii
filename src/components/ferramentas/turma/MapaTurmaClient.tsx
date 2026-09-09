"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Search, ClipboardList, ClipboardCheck, Users, Heart, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlunoMapa } from "@/lib/ferramentas/turma-mapa";

function formatData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// Prioridade de atenção: plano ativo pesa mais que pontos de atenção soltos.
function atencaoScore(a: AlunoMapa): number {
  return (a.temPlanoAtivo ? 3 : 0) + a.atencoes;
}

export default function MapaTurmaClient({ alunos }: { alunos: AlunoMapa[] }) {
  const [ordem, setOrdem] = useState<"atencao" | "az">("atencao");
  const [turma, setTurma] = useState<string>("todas");

  const turmas = useMemo(
    () => [...new Set(alunos.map((a) => a.class_label).filter((c): c is string => !!c))].sort(),
    [alunos]
  );

  const filtrados = useMemo(() => {
    const base = turma === "todas" ? alunos : alunos.filter((a) => a.class_label === turma);
    const arr = [...base];
    if (ordem === "az") arr.sort((a, b) => a.name.localeCompare(b.name));
    else arr.sort((a, b) => atencaoScore(b) - atencaoScore(a) || a.name.localeCompare(b.name));
    return arr;
  }, [alunos, turma, ordem]);

  const resumo = useMemo(() => {
    const base = turma === "todas" ? alunos : alunos.filter((a) => a.class_label === turma);
    return {
      total: base.length,
      comPlano: base.filter((a) => a.temPlanoAtivo).length,
      comAtencao: base.filter((a) => a.atencoes > 0 || a.temPlanoAtivo).length,
    };
  }, [alunos, turma]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href="/ferramentas/meus-alunos"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Meus alunos
      </Link>

      <h1 className="text-2xl font-bold">Mapa da turma</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Uma visão de todos os alunos para o conselho — quem está indo bem e quem precisa de atenção.
      </p>

      {alunos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-9 h-9 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground/80">Nenhum aluno cadastrado ainda</p>
          <p className="text-xs mt-1">Cadastre seus alunos em Meus Alunos para ver o mapa da turma.</p>
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="lumii-card p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{resumo.total}</p>
              <p className="text-xs text-muted-foreground">alunos</p>
            </div>
            <div className="lumii-card p-3 text-center">
              <p className="text-2xl font-bold text-lumii-coral">{resumo.comPlano}</p>
              <p className="text-xs text-muted-foreground">com plano ativo</p>
            </div>
            <div className="lumii-card p-3 text-center">
              <p className="text-2xl font-bold text-[#8a6410]">{resumo.comAtencao}</p>
              <p className="text-xs text-muted-foreground">precisam de atenção</p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setOrdem("atencao")}
                className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors", ordem === "atencao" ? "bg-white text-lumii-coral shadow-sm" : "text-muted-foreground")}
              >
                Atenção primeiro
              </button>
              <button
                type="button"
                onClick={() => setOrdem("az")}
                className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors", ordem === "az" ? "bg-white text-lumii-coral shadow-sm" : "text-muted-foreground")}
              >
                A–Z
              </button>
            </div>
            {turmas.length > 0 && (
              <select
                value={turma}
                onChange={(e) => setTurma(e.target.value)}
                className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
              >
                <option value="todas">Todas as turmas</option>
                {turmas.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>

          {/* Lista */}
          <div className="space-y-2">
            {filtrados.map((a) => {
              const precisaAtencao = a.temPlanoAtivo || a.atencoes > 0;
              return (
                <Link
                  key={a.id}
                  href={`/ferramentas/meus-alunos/aluno/${a.id}?aba=relatorio`}
                  className={cn(
                    "lumii-card p-3.5 flex items-center gap-3 hover:border-lumii-coral/40 transition-colors group",
                    precisaAtencao && "border-l-4 border-l-lumii-coral"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{a.name}</p>
                      {a.class_label && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground/50 shrink-0">{a.class_label}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      {a.positivos > 0 && <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3 text-lumii-yellow" /> {a.positivos}</span>}
                      {a.atencoes > 0 && <span className="inline-flex items-center gap-0.5"><Search className="w-3 h-3 text-lumii-coral" /> {a.atencoes}</span>}
                      {a.socioemocional > 0 && <span className="inline-flex items-center gap-0.5"><Heart className="w-3 h-3 text-[#8a63d2]" /> {a.socioemocional}</span>}
                      {a.temPlanoAtivo && <span className="inline-flex items-center gap-0.5 text-lumii-coral font-medium"><ClipboardList className="w-3 h-3" /> plano ativo</span>}
                      {a.metasAtivas > 0 && <span className="inline-flex items-center gap-0.5"><Target className="w-3 h-3 text-primary" /> {a.metasAtivas}</span>}
                      {a.avaliacoes > 0 && <span className="inline-flex items-center gap-0.5"><ClipboardCheck className="w-3 h-3" /> {a.avaliacoes}</span>}
                      {a.diarioTotal === 0 && !a.temPlanoAtivo && a.metasAtivas === 0 && a.avaliacoes === 0 && <span className="italic">sem registros</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-muted-foreground">{formatData(a.ultimaAtividade)}</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-lumii-coral transition-colors ml-auto mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
