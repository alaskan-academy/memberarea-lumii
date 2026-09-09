"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X, TrendingUp } from "lucide-react";
import {
  GOAL_AREAS,
  GOAL_AREA_MAP,
  GOAL_STATUS,
  CHECKIN_META,
  type CheckinStatus,
  type GoalArea,
  type GoalRow,
  type GoalStatus,
} from "@/lib/ferramentas/metas/types";
import { updateGoal, deleteGoal, setGoalStatus, createGoalCheckin, deleteGoalCheckin } from "@/lib/ferramentas/metas/actions";
import AutoGrowTextarea from "../support-plan/AutoGrowTextarea";

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const CHECKIN_ORDER: CheckinStatus[] = ["avancou", "estavel", "recuou"];

export default function GoalCard({ goal }: { goal: GoalRow }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [area, setArea] = useState<GoalArea>(goal.area);
  const [meta, setMeta] = useState(goal.meta);
  const [ckStatus, setCkStatus] = useState<CheckinStatus>("avancou");
  const [ckNota, setCkNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const areaMeta = GOAL_AREA_MAP[goal.area] ?? GOAL_AREA_MAP.outra;

  function run(fn: () => Promise<{ error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) {
        setError(res.error);
        return;
      }
      after?.();
      router.refresh();
    });
  }

  function saveEdit() {
    if (!meta.trim()) return setError("Descreva a meta");
    run(() => updateGoal({ goal_id: goal.id, area, meta: meta.trim() }), () => setEditing(false));
  }

  function addCheckin() {
    run(() => createGoalCheckin({ goal_id: goal.id, status: ckStatus, nota: ckNota.trim() || undefined }), () => {
      setCheckinOpen(false);
      setCkNota("");
      setCkStatus("avancou");
    });
  }

  if (editing) {
    return (
      <div className="lumii-card p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {GOAL_AREAS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setArea(a.value)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all min-h-[34px] ${
                area === a.value ? `${a.chip} ring-2 ring-offset-1 ring-current` : "bg-muted/60 text-foreground/60 hover:bg-muted"
              }`}
            >
              <span aria-hidden>{a.emoji}</span> {a.label}
            </button>
          ))}
        </div>
        <AutoGrowTextarea value={meta} onChange={setMeta} maxLength={500} maxHeight={160} className="bg-white" />
        {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => { setEditing(false); setArea(goal.area); setMeta(goal.meta); setError(null); }} disabled={isPending} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors min-h-[40px] disabled:opacity-50">
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button type="button" onClick={saveEdit} disabled={isPending || !meta.trim()} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-lumii-coral hover:bg-lumii-coral-hover transition-colors min-h-[40px] disabled:opacity-50">
            <Check className="w-4 h-4" /> Salvar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lumii-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${areaMeta.chip}`}>
          <span aria-hidden>{areaMeta.emoji}</span> {areaMeta.label}
        </span>
        <select
          value={goal.status}
          onChange={(e) => run(() => setGoalStatus({ goal_id: goal.id, status: e.target.value as GoalStatus }))}
          disabled={isPending}
          aria-label="Status da meta"
          className="text-xs rounded-lg border border-border bg-white px-2 py-1 text-foreground/70 focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
        >
          {GOAL_STATUS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap break-words">{goal.meta}</p>

      {/* Check-ins */}
      {goal.checkins.length > 0 && (
        <div className="mt-3 space-y-1">
          {goal.checkins.map((c) => (
            <div key={c.id} className="group flex items-start gap-2 text-sm bg-muted/40 rounded-lg px-2.5 py-1.5">
              <span aria-hidden>{CHECKIN_META[c.status].emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium">{CHECKIN_META[c.status].label}</span>
                <span className="text-xs text-muted-foreground ml-1.5">{formatData(c.created_at)}</span>
                {c.nota && <p className="text-xs text-muted-foreground mt-0.5">{c.nota}</p>}
              </div>
              <button type="button" onClick={() => run(() => deleteGoalCheckin(c.id))} disabled={isPending} aria-label="Excluir check-in" className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 p-1.5 rounded text-muted-foreground/60 hover:text-red-500 transition-all shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Novo check-in */}
      {checkinOpen && (
        <div className="mt-3 rounded-lg border border-border p-3 space-y-2">
          <div className="flex gap-1.5">
            {CHECKIN_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCkStatus(s)}
                className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] border ${
                  ckStatus === s ? "border-lumii-coral bg-lumii-coral/10 text-lumii-coral" : "border-border text-foreground/60 hover:border-lumii-coral/40"
                }`}
              >
                <span aria-hidden>{CHECKIN_META[s].emoji}</span> {CHECKIN_META[s].label}
              </button>
            ))}
          </div>
          <AutoGrowTextarea value={ckNota} onChange={setCkNota} placeholder="Uma nota (opcional)…" maxLength={500} maxHeight={120} className="bg-white" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setCheckinOpen(false); setCkNota(""); }} disabled={isPending} className="px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={addCheckin} disabled={isPending} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-lumii-coral hover:bg-lumii-coral-hover transition-colors disabled:opacity-50">
              <Check className="w-3.5 h-3.5" /> Registrar
            </button>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
        {!checkinOpen && (
          <button type="button" onClick={() => setCheckinOpen(true)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-lumii-coral hover:bg-lumii-coral/10 transition-colors">
            <TrendingUp className="w-3.5 h-3.5" /> Registrar progresso
          </button>
        )}
        <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Editar
        </button>
        <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Excluir meta" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors ml-auto">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {confirmDelete && (
        <div className="mt-2 flex items-center gap-2 text-xs bg-red-50 text-red-700 rounded-lg px-3 py-2">
          <span className="flex-1">Excluir esta meta{goal.checkins.length > 0 ? ` e seus ${goal.checkins.length} check-ins` : ""}? Não dá para desfazer.</span>
          <button type="button" onClick={() => setConfirmDelete(false)} disabled={isPending} className="px-2 py-1 rounded hover:bg-red-100 disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={() => run(() => deleteGoal(goal.id))} disabled={isPending} className="px-2 py-1 rounded bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50">Excluir</button>
        </div>
      )}
      {error && !confirmDelete && <p role="alert" className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
