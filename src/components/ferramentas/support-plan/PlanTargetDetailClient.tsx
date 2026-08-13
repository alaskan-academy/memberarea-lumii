"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, CheckCircle2 } from "lucide-react";
import type { CheckinRow, PlanTarget, SupportPlanRow } from "@/lib/ferramentas/support-plan/types";
import { closeSupportPlan } from "@/lib/ferramentas/support-plan/actions";
import PlanCard from "./PlanCard";
import CheckinModal from "./CheckinModal";

const CHECKIN_EMOJI: Record<CheckinRow["status"], string> = {
  melhorou: "🟢",
  igual: "🟡",
  piorou: "🔴",
};

const DIFICULDADE_LABELS: Record<string, string> = {
  iniciar_atividades: "Iniciar atividades",
  manter_atencao: "Manter atenção",
  seguir_instrucoes: "Seguir instruções",
  controlar_frustracao: "Controlar frustração",
  interagir_com_colegas: "Interagir com colegas",
  participar_em_grupo: "Participar de atividades em grupo",
  concluir_tarefas: "Concluir tarefas",
  lidar_com_mudancas_rotina: "Lidar com mudanças de rotina",
  outro: "Outro",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Tela de detalhe — a mesma para aluno e turma, só muda de onde vêm o id/nome/links. */
export default function PlanTargetDetailClient({
  target,
  plans,
}: {
  target: PlanTarget;
  plans: SupportPlanRow[];
}) {
  const router = useRouter();
  const activePlan = plans.find((p) => p.status === "ativo") ?? null;
  const pastPlans = plans.filter((p) => p.status !== "ativo");

  const [checkinOpen, setCheckinOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const novoPlanoHref =
    target.kind === "aluno"
      ? `/ferramentas/plano-apoio-aluno/aluno/${target.id}/novo-plano`
      : `/ferramentas/plano-apoio-aluno/turma/${target.id}/novo-plano`;

  function handleClosePlan() {
    if (!activePlan) return;
    setError(null);
    startTransition(async () => {
      const res = await closeSupportPlan(activePlan.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href="/ferramentas/plano-apoio-aluno"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        {target.kind === "aluno" ? "Meus alunos" : "Minhas turmas"}
      </Link>

      <h1 className="text-2xl font-bold mb-6">{target.name}</h1>

      {activePlan ? (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Plano ativo — {DIFICULDADE_LABELS[activePlan.dificuldade_principal] ?? activePlan.dificuldade_principal}
            </h2>
            <span className="text-xs text-muted-foreground">{formatDate(activePlan.created_at)}</span>
          </div>

          <div className="lumii-card p-5 sm:p-6">
            <PlanCard
              planId={activePlan.id}
              planoGerado={activePlan.plano_gerado}
              planLabel={DIFICULDADE_LABELS[activePlan.dificuldade_principal] ?? activePlan.dificuldade_principal}
            />
          </div>

          {error && <p role="alert" className="text-xs text-red-500">{error}</p>}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCheckinOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-semibold text-white bg-[#f6614f] hover:bg-[#e2543f] transition-colors min-h-[44px]"
            >
              Fazer check-in
            </button>
            <button
              type="button"
              onClick={handleClosePlan}
              disabled={isPending}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-semibold border border-border hover:border-[#f6614f] hover:text-[#f6614f] transition-colors min-h-[44px] disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Encerrar plano
            </button>
          </div>

          {activePlan.checkins.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Histórico de check-ins</p>
              <div className="space-y-1.5">
                {activePlan.checkins.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 text-sm bg-muted/40 rounded-lg px-3 py-2">
                    <span aria-hidden>{CHECKIN_EMOJI[c.status]}</span>
                    <div className="flex-1">
                      <p>
                        <span className="font-medium capitalize">{c.status}</span>{" "}
                        <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                      </p>
                      {c.notes && <p className="text-xs text-muted-foreground mt-0.5">{c.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link
          href={novoPlanoHref}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white bg-[#f6614f] hover:bg-[#e2543f] transition-colors min-h-[44px] mb-8"
        >
          <Plus className="w-4 h-4" />
          Criar novo plano
        </Link>
      )}

      {pastPlans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Planos anteriores</h2>
          {pastPlans.map((p) => (
            <details key={p.id} className="lumii-card p-4">
              <summary className="cursor-pointer text-sm font-semibold flex items-center justify-between">
                <span>{DIFICULDADE_LABELS[p.dificuldade_principal] ?? p.dificuldade_principal}</span>
                <span className="text-xs text-muted-foreground font-normal">{formatDate(p.created_at)}</span>
              </summary>
              <div className="mt-4 pt-4 border-t border-border/60">
                <PlanCard
                  planId={p.id}
                  planoGerado={p.plano_gerado}
                  planLabel={DIFICULDADE_LABELS[p.dificuldade_principal] ?? p.dificuldade_principal}
                />
              </div>
            </details>
          ))}
        </div>
      )}

      {activePlan && (
        <CheckinModal
          open={checkinOpen}
          onClose={() => setCheckinOpen(false)}
          supportPlanId={activePlan.id}
        />
      )}
    </div>
  );
}
