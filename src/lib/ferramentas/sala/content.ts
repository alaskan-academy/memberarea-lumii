// Conteúdo estático da "Sala de aula" — ferramentas ao vivo, sem banco.
// Tom acolhedor e no positivo (o que fazer, não o que não fazer), sem marca de
// gênero — no mesmo registro do gerador de parecer.

// Banco de combinados de convivência para o cartaz. A professora marca os que
// quer e/ou escreve os próprios.
export const COMBINADOS_SUGERIDOS: string[] = [
  "Levantar a mão para falar",
  "Ouvir com atenção quem está falando",
  "Respeitar a vez de cada um",
  "Tratar todos com gentileza",
  "Cuidar dos materiais e do espaço",
  "Guardar o que a gente usa",
  "Pedir ajuda quando precisar",
  "Ajudar quem está com dificuldade",
  "Falar baixinho durante as atividades",
  "Combinar antes de mudar de atividade",
  "Colaborar nos trabalhos em grupo",
  "Respeitar o espaço e o tempo do colega",
];

// Presets do cronômetro (em segundos) — os tempos mais comuns de sala.
export const CRONOMETRO_PRESETS: { label: string; seconds: number }[] = [
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
];

// Título padrão do cartaz de combinados (editável pela professora).
export const CARTAZ_TITULO_PADRAO = "Nossos combinados";
