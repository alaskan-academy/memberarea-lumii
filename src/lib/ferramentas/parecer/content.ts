// Banco de frases do Gerador de Parecer Descritivo — SEM IA (decisão do projeto).
// A professora escolhe, por aspecto, o nível observado; cada par aspecto×nível
// vira uma frase pronta, em 3ª pessoa e sem marca de gênero, montadas num texto
// corrido por buildParecer(). Rascunho meu — revisar com olhar pedagógico antes
// de tratar como copy final. Tom: acolhedor e claro, sem jargão acadêmico.

export type Nivel = "a_desenvolver" | "em_progresso" | "consolidado";

export type AspectoKey =
  | "participacao"
  | "convivencia"
  | "autonomia"
  | "atencao"
  | "organizacao"
  | "autorregulacao"
  | "comunicacao"
  | "criatividade";

export type ParecerInput = {
  nome: string; // nome do aluno; vazio → "o(a) estudante"
  periodo: string; // ex.: "1º bimestre"
  aspectos: Partial<Record<AspectoKey, Nivel>>; // só os aspectos incluídos
  observacao?: string; // frase livre opcional no fim
};

export const NIVEIS: { key: Nivel; label: string; hint: string }[] = [
  { key: "a_desenvolver", label: "A desenvolver", hint: "Está começando; precisa de apoio" },
  { key: "em_progresso", label: "Em progresso", hint: "Avançando, com mais autonomia" },
  { key: "consolidado", label: "Consolidado", hint: "Faz com segurança" },
];

export const ASPECTOS: { key: AspectoKey; label: string; desc: string }[] = [
  { key: "participacao", label: "Participação", desc: "Envolvimento nas aulas e atividades" },
  { key: "convivencia", label: "Convivência", desc: "Relação com colegas e adultos" },
  { key: "autonomia", label: "Autonomia", desc: "Fazer sozinho; pedir ajuda quando precisa" },
  { key: "atencao", label: "Atenção", desc: "Foco e concentração nas tarefas" },
  { key: "organizacao", label: "Organização", desc: "Materiais, tempo e rotina" },
  { key: "autorregulacao", label: "Emoções", desc: "Lidar com frustração e combinados" },
  { key: "comunicacao", label: "Comunicação", desc: "Expressar ideias e ouvir" },
  { key: "criatividade", label: "Criatividade", desc: "Propor ideias e resolver do próprio jeito" },
];

// Cada frase é um trecho em 3ª pessoa que se encaixa depois do nome ("Maria …")
// ou de um ponto-e-vírgula. Sem adjetivos com gênero.
export const FRASES: Record<AspectoKey, Record<Nivel, string>> = {
  participacao: {
    a_desenvolver:
      "tem participado de forma mais quieta, e temos incentivado a se soltar e mostrar o que pensa",
    em_progresso:
      "vem participando cada vez mais das atividades, arriscando perguntas e ideias com mais confiança",
    consolidado:
      "participa com entusiasmo e ajuda a puxar as conversas e propostas da turma",
  },
  convivencia: {
    a_desenvolver:
      "está aprendendo a conviver com os colegas, e seguimos ajudando a resolver os desentendimentos pelo diálogo",
    em_progresso:
      "convive bem com a turma e, aos poucos, tem lidado melhor com dividir e com as combinações",
    consolidado:
      "convive muito bem com colegas e adultos, respeita as combinações e acolhe quem está por perto",
  },
  autonomia: {
    a_desenvolver:
      "ainda precisa de apoio para começar e concluir as tarefas, e trabalhamos isso passo a passo",
    em_progresso:
      "vem construindo a autonomia: já tenta sozinho antes de pedir ajuda e conclui boa parte das tarefas",
    consolidado:
      "realiza as tarefas com autonomia, organiza-se sozinho e pede ajuda quando de fato precisa",
  },
  atencao: {
    a_desenvolver:
      "se distrai com facilidade, e temos usado combinados e tarefas mais curtas para ajudar na concentração",
    em_progresso:
      "tem sustentado a atenção por mais tempo, sobretudo nas atividades que desperta o interesse",
    consolidado:
      "mantém a atenção do início ao fim das atividades e retoma o foco sozinho quando se dispersa",
  },
  organizacao: {
    a_desenvolver:
      "está aprendendo a cuidar dos materiais e a seguir a rotina, com lembretes ao longo do dia",
    em_progresso:
      "vem se organizando melhor com os materiais e o tempo, precisando de menos lembretes",
    consolidado:
      "mantém materiais e rotina em ordem e se prepara sozinho para cada momento do dia",
  },
  autorregulacao: {
    a_desenvolver:
      "está aprendendo a lidar com a frustração, e seguimos ajudando a nomear e acolher o que sente",
    em_progresso:
      "tem lidado melhor com as emoções e, quando se desregula, aceita ajuda para se acalmar",
    consolidado:
      "lida bem com a frustração e respeita os combinados mesmo nos momentos mais difíceis",
  },
  comunicacao: {
    a_desenvolver:
      "está descobrindo formas de se expressar e de ouvir, e incentivamos que compartilhe mais o que pensa e sente",
    em_progresso:
      "comunica as ideias com mais clareza e vem aprendendo a ouvir os colegas antes de responder",
    consolidado:
      "expressa as ideias com clareza, ouve os colegas com respeito e sabe esperar a vez de falar",
  },
  criatividade: {
    a_desenvolver:
      "está descobrindo o próprio jeito de criar, e propomos atividades abertas para explorar sem medo de errar",
    em_progresso:
      "tem trazido ideias próprias e experimenta caminhos diferentes para resolver o que aparece",
    consolidado:
      "cria com liberdade, propõe ideias originais e encontra soluções próprias para os desafios",
  },
};

export const FECHAMENTO = "Seguimos acompanhando seu desenvolvimento com atenção e carinho.";
