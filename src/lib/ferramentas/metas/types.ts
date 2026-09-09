// Metas socioemocionais — tipos + vocabulário (espelha os CHECKs da migration
// 20260908_student_goals.sql). Tom acolhedor, no registro do gerador de parecer.

export type GoalArea =
  | "convivencia"
  | "autorregulacao" // emoções
  | "autonomia"
  | "participacao"
  | "comunicacao"
  | "outra";

export type GoalStatus = "em_andamento" | "alcancada" | "pausada";

export type CheckinStatus = "avancou" | "estavel" | "recuou";

export interface GoalCheckin {
  id: string;
  status: CheckinStatus;
  nota: string | null;
  created_at: string;
}

export interface GoalRow {
  id: string;
  area: GoalArea;
  meta: string;
  status: GoalStatus;
  created_at: string;
  checkins: GoalCheckin[];
}

export const GOAL_AREAS: { value: GoalArea; label: string; emoji: string; chip: string }[] = [
  { value: "convivencia", label: "Convivência", emoji: "🤝", chip: "bg-emerald-500/12 text-emerald-700" },
  { value: "autorregulacao", label: "Emoções", emoji: "💛", chip: "bg-[#8a63d2]/12 text-[#6b4bb0]" },
  { value: "autonomia", label: "Autonomia", emoji: "🌱", chip: "bg-primary/12 text-primary" },
  { value: "participacao", label: "Participação", emoji: "🙋", chip: "bg-lumii-yellow/15 text-[#8a6410]" },
  { value: "comunicacao", label: "Comunicação", emoji: "💬", chip: "bg-sky-500/12 text-sky-700" },
  { value: "outra", label: "Outra", emoji: "🎯", chip: "bg-muted text-foreground/70" },
];

export const GOAL_AREA_MAP: Record<GoalArea, (typeof GOAL_AREAS)[number]> = Object.fromEntries(
  GOAL_AREAS.map((a) => [a.value, a])
) as Record<GoalArea, (typeof GOAL_AREAS)[number]>;

export const GOAL_STATUS: { value: GoalStatus; label: string; chip: string }[] = [
  { value: "em_andamento", label: "Em andamento", chip: "bg-lumii-yellow/15 text-[#8a6410]" },
  { value: "alcancada", label: "Alcançada", chip: "bg-primary/15 text-primary" },
  { value: "pausada", label: "Pausada", chip: "bg-muted text-foreground/50" },
];

export const GOAL_STATUS_MAP: Record<GoalStatus, (typeof GOAL_STATUS)[number]> = Object.fromEntries(
  GOAL_STATUS.map((s) => [s.value, s])
) as Record<GoalStatus, (typeof GOAL_STATUS)[number]>;

export const CHECKIN_META: Record<CheckinStatus, { label: string; emoji: string }> = {
  avancou: { label: "Avançou", emoji: "🟢" },
  estavel: { label: "Estável", emoji: "🟡" },
  recuou: { label: "Recuou", emoji: "🔴" },
};
