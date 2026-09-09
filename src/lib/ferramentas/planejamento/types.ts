// Biblioteca de planos e atividades — tipos + vocabulário.
// O conjunto de `tipo` aqui é a fonte no front e espelha o CHECK da coluna
// lesson_resources.tipo (migration 20260908_lesson_resources.sql).

export type BibliotecaTipo =
  | "plano" // plano de aula
  | "atividade"
  | "sequencia" // sequência didática
  | "avaliacao"
  | "projeto"
  | "material" // material de apoio
  | "outro";

// conteudo (jsonb) — hoje só um corpo de texto; jsonb para poder crescer depois.
export interface ResourceConteudo {
  texto: string;
}

export interface LessonResourceRow {
  id: string;
  titulo: string;
  tipo: BibliotecaTipo;
  texto: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const BIBLIOTECA_TIPOS: {
  value: BibliotecaTipo;
  label: string;
  emoji: string;
  chip: string;
}[] = [
  { value: "plano", label: "Plano de aula", emoji: "📋", chip: "bg-primary/12 text-primary" },
  { value: "atividade", label: "Atividade", emoji: "✏️", chip: "bg-lumii-yellow/15 text-[#8a6410]" },
  { value: "sequencia", label: "Sequência didática", emoji: "🧩", chip: "bg-[#8a63d2]/12 text-[#6b4bb0]" },
  { value: "avaliacao", label: "Avaliação", emoji: "📝", chip: "bg-lumii-coral/12 text-lumii-coral" },
  { value: "projeto", label: "Projeto", emoji: "🌱", chip: "bg-emerald-500/12 text-emerald-700" },
  { value: "material", label: "Material de apoio", emoji: "📎", chip: "bg-sky-500/12 text-sky-700" },
  { value: "outro", label: "Outro", emoji: "📄", chip: "bg-muted text-foreground/70" },
];

export const BIBLIOTECA_TIPO_MAP: Record<BibliotecaTipo, (typeof BIBLIOTECA_TIPOS)[number]> =
  Object.fromEntries(BIBLIOTECA_TIPOS.map((t) => [t.value, t])) as Record<
    BibliotecaTipo,
    (typeof BIBLIOTECA_TIPOS)[number]
  >;
