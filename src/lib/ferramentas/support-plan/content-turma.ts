import type { SupportPlanTemplate } from "./types";

/**
 * RASCUNHO — versão "turma" dos 8 templates de content.ts, mesma base
 * conceitual (ver cabeçalho de content.ts para a fundamentação científica
 * completa), mas com fraseado coletivo em vez de individual: "a turma"
 * em vez de "o aluno", estratégias que funcionam em escala (sinal coletivo,
 * quadro visual pra todos) em vez de combinados 1:1. Precisa de revisão
 * humana (pedagogo/psicopedagogo) antes de considerar definitivo/publicado.
 */
export const SUPPORT_PLAN_TEMPLATES_TURMA: SupportPlanTemplate[] = [
  {
    dificuldade_principal: "iniciar_atividades",
    objetivo:
      "Nas próximas 2 semanas, a turma leva menos tempo entre a instrução e o início real da atividade, com no máximo um lembrete coletivo.",
    antes_da_atividade:
      "Avise a transição com antecedência para a turma toda (\"em 2 minutos vamos começar a atividade X\") e use um sinal sonoro ou visual combinado para marcar o início.",
    durante:
      "Comece a atividade já com o primeiro passo modelado no quadro ou projetado, para reduzir a barreira de começar do zero para a turma inteira.",
    se_houver_recusa:
      "Ofereça uma escolha dentro da própria atividade para o grupo (\"vocês preferem começar pelo desenho ou pelo texto?\") em vez de impor uma única sequência rígida.",
    o_que_observar:
      "Quanto tempo leva, em média, entre a instrução e o início real da atividade para a maior parte da turma, e se esse tempo diminui ao longo das duas semanas.",
  },
  {
    dificuldade_principal: "manter_atencao",
    objetivo:
      "Nas próximas 2 semanas, a turma mantém o foco na atividade proposta por períodos um pouco mais longos, com pausas coletivas estruturadas.",
    antes_da_atividade:
      "Divida a atividade em blocos menores e visíveis no quadro (ex: 3 etapas numeradas) em vez de apresentar a tarefa inteira de uma vez.",
    durante:
      "Use um sinal combinado (palavra, gesto ou som) para reconduzir o foco da turma, em vez de repetir pedidos de silêncio isoladamente.",
    se_houver_recusa:
      "Quando o foco cair de forma generalizada, ofereça uma pausa breve e estruturada (alongamento, água) antes de retomar, em vez de insistir na mesma atividade.",
    o_que_observar:
      "Em que momentos da aula o foco da turma costuma cair (início, meio, final) e se algum tipo de atividade sustenta a atenção coletiva por mais tempo.",
  },
  {
    dificuldade_principal: "seguir_instrucoes",
    objetivo:
      "Nas próximas 2 semanas, a turma segue instruções coletivas com no máximo uma repetição, sem precisar de repetição individual constante.",
    antes_da_atividade:
      "Dê instruções curtas, uma de cada vez, e peça para um ou dois alunos repetirem em voz alta antes da turma começar, confirmando que a instrução foi entendida por todos.",
    durante:
      "Use apoio visual (lista no quadro) além da instrução falada, para reduzir a dependência da memória auditiva coletiva.",
    se_houver_recusa:
      "Reformule a instrução de forma mais concreta em vez de repetir a mesma frase no mesmo tom — muitas vezes o problema é a clareza da instrução, não a vontade de seguir.",
    o_que_observar:
      "Se instruções dadas em bloco são seguidas com mais dificuldade do que instruções entregues também por escrito, e em que tipo de atividade isso acontece mais.",
  },
  {
    dificuldade_principal: "controlar_frustracao",
    objetivo:
      "Nas próximas 2 semanas, a turma consegue sinalizar frustração coletiva antes que ela vire tumulto, com apoio do professor.",
    antes_da_atividade:
      "Combine com a turma um sinal simples que qualquer aluno pode usar para pedir uma pausa quando a atividade estiver difícil (ex: levantar um cartão).",
    durante:
      "Ao notar sinais de frustração se espalhando pela turma, valide o sentimento em voz alta e acolhedora (\"percebi que essa parte ficou difícil pra galera\") antes que a situação escale.",
    se_houver_recusa:
      "Ofereça uma pausa coletiva combinada (alongamento, respiração) em vez de insistir que a turma continue imediatamente na mesma atividade.",
    o_que_observar:
      "Quais tipos de atividade costumam preceder os momentos de frustração coletiva mais intensa, para antecipar apoio nessas situações específicas.",
  },
  {
    dificuldade_principal: "interagir_com_colegas",
    objetivo:
      "Nas próximas 2 semanas, a turma tem mais momentos de interação positiva estruturada entre os alunos, mediados quando necessário.",
    antes_da_atividade:
      "Estruture a interação com papéis claros dentro de cada grupo pequeno (ex: \"cada grupo tem um responsável pelo material\") em vez de deixar a formação de grupos totalmente livre.",
    durante:
      "Circule entre os grupos nos primeiros minutos da atividade para mediar quando necessário, sem assumir a interação no lugar dos alunos.",
    se_houver_recusa:
      "Comece com duplas já combinadas antes de propor grupos maiores, para a turma ganhar prática gradual em interações estruturadas.",
    o_que_observar:
      "Que composições de grupo funcionam melhor, e em que tipo de atividade (livre vs. estruturada) a interação flui com menos mediação.",
  },
  {
    dificuldade_principal: "participar_em_grupo",
    objetivo:
      "Nas próximas 2 semanas, a turma participa de atividades em grupo por períodos crescentes, com papéis definidos dentro de cada grupo.",
    antes_da_atividade:
      "Defina com antecedência papéis específicos e concretos para cada grupo (ex: responsável pelo material, por anotar as ideias, por apresentar).",
    durante:
      "Circule com mais frequência nos primeiros minutos da atividade em grupo, reforçando de forma discreta quando os grupos contribuírem bem.",
    se_houver_recusa:
      "Permita que grupos mais resistentes observem outro grupo trabalhando por um tempo antes de exigir entrada imediata na dinâmica.",
    o_que_observar:
      "Se o tamanho dos grupos influencia a participação (grupos menores costumam facilitar) e em que momento da atividade a turma costuma se dispersar.",
  },
  {
    dificuldade_principal: "concluir_tarefas",
    objetivo:
      "Nas próximas 2 semanas, a turma conclui as tarefas propostas dentro do tempo combinado, com apoio de checkpoints intermediários coletivos.",
    antes_da_atividade:
      "Divida a tarefa em etapas visíveis no quadro e marque um checkpoint coletivo no meio, em vez de apresentar só o resultado final esperado.",
    durante:
      "Confira o progresso da turma no checkpoint combinado, e reforce especificamente o que já foi feito antes de indicar o que falta.",
    se_houver_recusa:
      "Reduza o volume da tarefa para a turma toda, mantendo o mesmo objetivo de aprendizagem, para que todos experimentem a sensação de terminar algo.",
    o_que_observar:
      "Em que ponto da tarefa a maior parte da turma costuma perder o ritmo, e se o tamanho da tarefa — não a dificuldade do conteúdo — está relacionado a isso.",
  },
  {
    dificuldade_principal: "lidar_com_mudancas_rotina",
    objetivo:
      "Nas próximas 2 semanas, a turma lida com mudanças na rotina da sala com reação mais tranquila, com aviso prévio adequado.",
    antes_da_atividade:
      "Avise a mudança de rotina com a maior antecedência possível, de forma concreta para todos (\"hoje não vamos ter educação física, vamos ter…\") em vez de anunciar em cima da hora.",
    durante:
      "Se possível, mantenha algum elemento familiar da rotina (mesmo horário de início, mesma disposição da sala) mesmo quando o restante muda.",
    se_houver_recusa:
      "Use um quadro de rotina visual fixado na sala que a turma toda possa consultar quando sentir insegurança com a mudança.",
    o_que_observar:
      "Que tipo de mudança (de horário, de atividade, de professor) gera mais reação na turma, para conseguir antecipar aviso e apoio extra nesses casos.",
  },
];
