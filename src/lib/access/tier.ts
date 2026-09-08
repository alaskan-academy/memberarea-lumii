// Helpers PUROS de tier — usáveis em client e server (sem side effects, sem
// service client). A detecção em si (getTier) fica em ./getTier.ts (server-only).
// Espelha a função current_tier() no banco — as duas precisam concordar.

export type Tier = "visitante" | "gratis" | "aluna" | "completo" | "admin";

// Ordem de acesso crescente. admin no topo (equipe passa por qualquer requiredTier).
export const TIER_ORDER: readonly Tier[] = [
  "visitante",
  "gratis",
  "aluna",
  "completo",
  "admin",
];

export function tierRank(t: Tier): number {
  const i = TIER_ORDER.indexOf(t);
  return i < 0 ? 0 : i;
}

/** `current` atende ao `required`? (comparação pela ordem; admin passa em tudo). */
export function tierAtLeast(current: Tier, required: Tier): boolean {
  return tierRank(current) >= tierRank(required);
}

export const TIER_LABEL: Record<Tier, string> = {
  visitante: "Visitante",
  gratis: "Cadastro grátis",
  aluna: "Aluna",
  completo: "Lumii Completo",
  admin: "Admin",
};
