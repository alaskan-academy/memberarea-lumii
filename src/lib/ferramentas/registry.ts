import type { LucideIcon } from "lucide-react";
import { MessageCircle, Users, FileText, Dices, Library } from "lucide-react";
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
    slug: "meus-alunos",
    title: "Meus Alunos",
    subtitle: "Diário, planos e acompanhamento",
    description: "Cadastre seus alunos e turmas; registre o diário de bordo e planos de apoio. O histórico do ano num lugar só.",
    icon: Users,
    publico: "Professores",
    free: false,
    categorySlugs: ["professores"],
  },
  {
    slug: "parecer-descritivo",
    title: "Parecer descritivo",
    subtitle: "Comentário de boletim pronto",
    description: "Marque como o aluno está em cada aspecto e gere um parecer humanizado, pronto para copiar.",
    icon: FileText,
    publico: "Professores",
    // Grátis: cavalo de entrada. Aparece para todos; salvar por aluno virá com o tier aluna.
    free: true,
    categorySlugs: ["professores"],
  },
  {
    slug: "planejamento",
    title: "Planejamento",
    subtitle: "Biblioteca de planos e atividades",
    description: "Salve seus planos de aula e atividades e reuse ano a ano — sua biblioteca particular.",
    icon: Library,
    publico: "Professores",
    free: false,
    categorySlugs: ["professores"],
  },
  {
    slug: "sala-de-aula",
    title: "Sala de aula",
    subtitle: "Sorteio, cronômetro e combinados",
    description: "Utilitários ao vivo para a aula: sortear alunos, cronômetro visual e cartaz de combinados. Sem cadastro.",
    icon: Dices,
    publico: "Professores",
    // Grátis (hook de uso diário): aparece para qualquer conta logada, sem salvar nada.
    free: true,
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
