import { SUPPORT_PLAN_TEMPLATES } from "./content";
import { NOTA_SUGESTAO_COORDENACAO } from "./types";
import type { PlanoGerado, SupportPlanInput } from "./types";

/**
 * Ponto de extensão para IA futura — ver PLAN-ferramentas.md seção 8.
 * Hoje faz lookup síncrono no template estático (sem chamada de rede, por
 * isso não é Server Action). Se algum dia isso virar uma chamada de IA,
 * essa função vira async e passa a viver em actions.ts como Server Action
 * (a API key não pode ficar exposta no client) — mas a assinatura de input
 * e o formato de retorno (PlanoGerado) não precisam mudar.
 */
export function buildSupportPlanDraft(input: SupportPlanInput): PlanoGerado {
  const template = SUPPORT_PLAN_TEMPLATES.find(
    (t) => t.dificuldade_principal === input.dificuldade_principal
  );
  const sugestao_coordenacao = input.sugerir_coordenacao ? NOTA_SUGESTAO_COORDENACAO : null;

  if (!template) {
    // dificuldade_principal === "outro" — sem template correspondente,
    // estrutura em branco pro professor preencher manualmente
    return {
      objetivo: "",
      antes_da_atividade: "",
      durante: "",
      se_houver_recusa: "",
      o_que_observar: "",
      sugestao_coordenacao,
    };
  }

  return {
    objetivo: template.objetivo,
    antes_da_atividade: template.antes_da_atividade,
    durante: template.durante,
    se_houver_recusa: template.se_houver_recusa,
    o_que_observar: template.o_que_observar,
    sugestao_coordenacao,
  };
}
