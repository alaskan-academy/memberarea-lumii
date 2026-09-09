// Diário de bordo — tipos + vocabulário de tipos de registro.
// O vocabulário aqui é a fonte no front; o mesmo conjunto está no CHECK da
// coluna student_log.tipo (migration 20260908_student_log_diario.sql). Se mudar
// um, mudar o outro.

export type DiarioTipo =
  | "registro" // registro geral (neutro, padrão)
  | "positivo" // conquista / elogio
  | "atencao" // ponto de atenção (não "problema")
  | "aprendizagem" // avanço/pedagógico
  | "socioemocional" // sentimentos, relações
  | "familia"; // contato com a família

export interface StudentLogRow {
  id: string;
  tipo: DiarioTipo;
  texto: string;
  data: string; // YYYY-MM-DD (data do fato)
  created_at: string;
}

// value → rótulo + descrição + cor/emoji. Tom acolhedor e neutro, no mesmo
// registro do gerador de parecer (sem jargão, sem marca de gênero).
export const DIARIO_TIPOS: {
  value: DiarioTipo;
  label: string;
  emoji: string;
  desc: string;
  // classes de "chip" (fundo suave + texto) usando tokens da marca
  chip: string;
}[] = [
  {
    value: "registro",
    label: "Registro",
    emoji: "📝",
    desc: "Anotação geral do dia",
    chip: "bg-muted text-foreground/70",
  },
  {
    value: "positivo",
    label: "Conquista",
    emoji: "⭐",
    desc: "Um avanço, um elogio, algo que deu certo",
    chip: "bg-lumii-yellow/15 text-[#8a6410]",
  },
  {
    value: "atencao",
    label: "Ponto de atenção",
    emoji: "🔎",
    desc: "Algo para acompanhar de perto",
    chip: "bg-lumii-coral/12 text-lumii-coral",
  },
  {
    value: "aprendizagem",
    label: "Aprendizagem",
    emoji: "📚",
    desc: "Progresso ou dificuldade em conteúdos",
    chip: "bg-primary/12 text-primary",
  },
  {
    value: "socioemocional",
    label: "Socioemocional",
    emoji: "💛",
    desc: "Emoções, relações e convivência",
    chip: "bg-[#8a63d2]/12 text-[#6b4bb0]",
  },
  {
    value: "familia",
    label: "Família",
    emoji: "🏡",
    desc: "Conversa ou combinado com a família",
    chip: "bg-emerald-500/12 text-emerald-700",
  },
];

export const DIARIO_TIPO_MAP: Record<DiarioTipo, (typeof DIARIO_TIPOS)[number]> =
  Object.fromEntries(DIARIO_TIPOS.map((t) => [t.value, t])) as Record<
    DiarioTipo,
    (typeof DIARIO_TIPOS)[number]
  >;
