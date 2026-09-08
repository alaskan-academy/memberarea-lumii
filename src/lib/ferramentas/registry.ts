import type { LucideIcon } from "lucide-react";
import { MessageCircle, ClipboardList } from "lucide-react";
import type { Tier } from "@/lib/access/tier";

// Registro das ferramentas (hardcoded por ora; vira tabela `tools` no admin
// quando fizer sentido). Cada ferramenta declara se é gratuita e quais
// categorias de curso a desbloqueiam.
export type ToolDef = {
  slug: string; // rota /ferramentas/<slug>
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  publico: "Pais" | "Professores";
  // free=true → visível a QUALQUER conta logada. Senão, só quem tem curso ativo
  // numa das categorySlugs (ou completo/admin, que veem tudo).
  free: boolean;
  categorySlugs: string[];
};

export const TOOLS: ToolDef[] = [
  {
    slug: "o-que-eu-digo-agora",
    title: "O que eu digo agora?",
    subtitle: "Conversas difíceis",
    description: "Situação + idade da criança → um script pronto para usar na hora, sem enrolação.",
    icon: MessageCircle,
    publico: "Pais",
    free: false,
    categorySlugs: ["pais"],
  },
  {
    slug: "plano-apoio-aluno",
    title: "Plano de Apoio",
    subtitle: "Plano de ação — aluno ou turma",
    description: "Cadastre o aluno ou a turma, gere um plano de apoio de 2 semanas e acompanhe com check-ins.",
    icon: ClipboardList,
    publico: "Professores",
    free: false,
    categorySlugs: ["professores"],
  },
];

/**
 * A aluna enxerga esta ferramenta?
 * - gratuita → sempre;
 * - completo/admin → veem tudo;
 * - senão → precisa de curso ativo numa das categorias da ferramenta.
 */
export function hasToolAccess(
  tool: ToolDef,
  tier: Tier,
  userCategorySlugs: Set<string>
): boolean {
  if (tool.free) return true;
  if (tier === "admin" || tier === "completo") return true;
  return tool.categorySlugs.some((s) => userCategorySlugs.has(s));
}
