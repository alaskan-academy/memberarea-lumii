// Rubricas — tipos.
// Uma rubrica = critérios (linhas) × escala (níveis, colunas). A prof monta o
// template; depois "aplica" a um aluno, escolhendo um nível por critério.

export interface RubricCriterio {
  id: string; // id estável (gerado no client), usado como chave nas notas
  nome: string;
}

export interface RubricRow {
  id: string;
  titulo: string;
  escala: string[]; // rótulos dos níveis, do menor pro maior
  itens: RubricCriterio[];
  created_at: string;
  updated_at: string;
}

export interface RubricScoreRow {
  id: string;
  rubric_id: string;
  student_id: string;
  studentName: string;
  // criterioId → índice na escala (0 = primeiro nível)
  niveis: Record<string, number>;
  comentario: string;
  created_at: string;
}

// Avaliação de um aluno já enriquecida com a definição da rubrica — para o
// relatório de conselho/reunião (que precisa dos rótulos de critério e nível).
export interface StudentRubricScore {
  id: string;
  created_at: string;
  comentario: string;
  rubricTitulo: string;
  escala: string[];
  itens: RubricCriterio[];
  niveis: Record<string, number>;
}

// Escala padrão ao criar uma rubrica nova (mesmo tom do gerador de parecer).
export const ESCALA_PADRAO: string[] = ["Ainda não", "Em desenvolvimento", "Consolidado"];

// Cores dos níveis por posição (baixo → alto), para os chips do resultado.
export const NIVEL_CORES: string[] = [
  "bg-lumii-coral/12 text-lumii-coral",
  "bg-lumii-yellow/15 text-[#8a6410]",
  "bg-primary/12 text-primary",
  "bg-emerald-500/12 text-emerald-700",
];

export function corDoNivel(indice: number, total: number): string {
  if (total <= 1) return NIVEL_CORES[NIVEL_CORES.length - 1];
  // mapeia o índice para a paleta (baixo=coral … alto=verde)
  const pos = Math.round((indice / (total - 1)) * (NIVEL_CORES.length - 1));
  return NIVEL_CORES[Math.max(0, Math.min(NIVEL_CORES.length - 1, pos))];
}
