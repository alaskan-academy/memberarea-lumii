export type DificuldadePrincipal =
  | "iniciar_atividades"
  | "manter_atencao"
  | "seguir_instrucoes"
  | "controlar_frustracao"
  | "interagir_com_colegas"
  | "participar_em_grupo"
  | "concluir_tarefas"
  | "lidar_com_mudancas_rotina"
  | "outro";

// O professor escolhe se o plano é para um aluno específico ou pra turma toda —
// muda qual conjunto de templates é usado (content.ts vs content-turma.ts) e o
// fraseado (singular "o aluno" vs coletivo "a turma").
export type PlanAlvo = "aluno" | "turma";

// Identifica o aluno ou a turma sendo visualizado/editado nas telas — a UI é a
// mesma para os dois casos, só muda de onde vem o id/nome.
export type PlanTarget =
  | { kind: "aluno"; id: string; name: string }
  | { kind: "turma"; id: string; name: string };

export interface SupportPlanInput {
  alvo: PlanAlvo;
  dificuldade_principal: DificuldadePrincipal;
  dificuldade_principal_outro?: string; // obrigatório se dificuldade_principal === 'outro'
  tambem_apresenta: string[];
  ponto_forte?: string;
  ja_tentei?: string;
  sugerir_coordenacao?: boolean;
}

export interface PlanoGerado {
  objetivo: string;
  antes_da_atividade: string;
  durante: string;
  se_houver_recusa: string;
  o_que_observar: string;
  sugestao_coordenacao: string | null;
}

export interface CheckinRow {
  id: string;
  status: "melhorou" | "igual" | "piorou";
  notes: string | null;
  created_at: string;
}

export interface SupportPlanRow {
  id: string;
  dificuldade_principal: string;
  status: "ativo" | "encerrado";
  plano_gerado: PlanoGerado;
  created_at: string;
  checkins: CheckinRow[];
}

/**
 * Ponto de extensão para IA futura (Fase 2 — ver PLAN-ferramentas.md seção 8).
 * Hoje faz lookup síncrono em content.ts; no futuro pode virar uma chamada a um
 * modelo de linguagem, sem mudar a assinatura, o schema salvo ou a UI.
 */
export type BuildSupportPlanDraft = (input: SupportPlanInput) => PlanoGerado;

export interface SupportPlanTemplate {
  dificuldade_principal: Exclude<DificuldadePrincipal, "outro">;
  objetivo: string;
  antes_da_atividade: string;
  durante: string;
  se_houver_recusa: string;
  o_que_observar: string;
}

export const DIFICULDADES: { value: DificuldadePrincipal; label: string }[] = [
  { value: "iniciar_atividades", label: "Iniciar atividades" },
  { value: "manter_atencao", label: "Manter atenção" },
  { value: "seguir_instrucoes", label: "Seguir instruções" },
  { value: "controlar_frustracao", label: "Controlar frustração" },
  { value: "interagir_com_colegas", label: "Interagir com colegas" },
  { value: "participar_em_grupo", label: "Participar de atividades em grupo" },
  { value: "concluir_tarefas", label: "Concluir tarefas" },
  { value: "lidar_com_mudancas_rotina", label: "Lidar com mudanças de rotina" },
  { value: "outro", label: "Outro" },
];

export const TAMBEM_APRESENTA_CHIPS: string[] = [
  "Distração",
  "Frustração",
  "Ansiedade",
  "Dificuldade social",
  "Dificuldade de linguagem",
  "Dificuldade motora",
  "Dificuldade de atenção",
];

// Fraseado neutro de propósito — vale tanto para plano de aluno quanto de turma,
// evita ter que passar `alvo` até aqui só por causa de uma palavra.
export const NOTA_SUGESTAO_COORDENACAO =
  "Se essa dificuldade for muito intensa, persistente ou impactar bastante o dia a dia em sala, vale conversar com a coordenação pedagógica ou orientação escolar.";

// Fixo, sempre visível em todo plano — diferente de NOTA_SUGESTAO_COORDENACAO,
// que é opcional (checkbox) e específica daquele plano.
export const DISCLAIMER_SUPPORT_PLAN =
  "Este plano é uma sugestão pedagógica geral — não é um diagnóstico nem substitui avaliação profissional. Ajuste sempre com base no que você conhece da situação.";
