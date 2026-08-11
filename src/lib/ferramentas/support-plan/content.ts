import type { SupportPlanTemplate } from "./types";

/**
 * RASCUNHO — 8 templates (um por dificuldade_principal, exceto "outro") escritos
 * seguindo o checklist de PLAN-ferramentas.md (seção 6.3): nenhuma linguagem de
 * diagnóstico clínico, nenhum tom acusatório em relação ao aluno, estratégias
 * pedagógicas/comportamentais aplicáveis por um professor sem formação clínica,
 * específicas e práticas. Precisa de revisão humana antes de considerar este
 * conteúdo definitivo/publicado.
 */
export const SUPPORT_PLAN_TEMPLATES: SupportPlanTemplate[] = [
  {
    dificuldade_principal: "iniciar_atividades",
    objetivo:
      "Nas próximas 2 semanas, o aluno consegue começar a atividade proposta em até 5 minutos após a instrução, com no máximo um lembrete.",
    antes_da_atividade:
      "Avise a transição com antecedência (\"em 2 minutos vamos começar a atividade X\") e explique em uma frase curta o que será feito, evitando instruções longas antes de começar.",
    durante:
      "Dê o primeiro passo já demonstrado ou já pronto para o aluno continuar (ex: primeira linha escrita, primeiro material posicionado), para reduzir a barreira de começar do zero.",
    se_houver_recusa:
      "Ofereça uma escolha dentro da própria atividade (\"você quer começar pelo desenho ou pelo texto?\") em vez de insistir na atividade como um bloco único e sem alternativas.",
    o_que_observar:
      "Quanto tempo leva entre a instrução e o início real da atividade, e se esse tempo diminui ao longo das duas semanas.",
  },
  {
    dificuldade_principal: "manter_atencao",
    objetivo:
      "Nas próximas 2 semanas, o aluno consegue manter o foco na atividade proposta por períodos um pouco mais longos, com pausas estruturadas quando necessário.",
    antes_da_atividade:
      "Divida a atividade em blocos menores e visíveis (ex: 3 etapas marcadas no caderno) em vez de apresentar a tarefa inteira de uma vez.",
    durante:
      "Combine sinais discretos para reconduzir o foco (ex: tocar de leve na carteira, um gesto combinado) em vez de chamar atenção verbalmente na frente da turma.",
    se_houver_recusa:
      "Se a atenção se perder, ofereça uma pausa breve e estruturada (levantar, beber água) antes de retomar, em vez de exigir concentração contínua sem intervalo.",
    o_que_observar:
      "Em que momentos da atividade a atenção costuma cair (início, meio, final) e se algum tipo de tarefa mantém o foco por mais tempo que outras.",
  },
  {
    dificuldade_principal: "seguir_instrucoes",
    objetivo:
      "Nas próximas 2 semanas, o aluno consegue seguir instruções de rotina com no máximo uma repetição, sem precisar de instrução individual repetida.",
    antes_da_atividade:
      "Dê instruções curtas, uma de cada vez, e peça para o aluno repetir com as próprias palavras antes de começar, para confirmar que a instrução foi compreendida.",
    durante:
      "Use apoio visual (lista curta no quadro ou na carteira) além da instrução falada, para reduzir a dependência da memória auditiva.",
    se_houver_recusa:
      "Reformule a instrução de forma mais concreta e específica em vez de repetir a mesma frase no mesmo tom — muitas vezes o problema é a clareza da instrução, não a vontade de seguir.",
    o_que_observar:
      "Se as instruções em grupo são seguidas com mais dificuldade do que instruções dadas diretamente ao aluno, e em que tipo de tarefa isso acontece mais.",
  },
  {
    dificuldade_principal: "controlar_frustracao",
    objetivo:
      "Nas próximas 2 semanas, o aluno consegue sinalizar frustração antes de reagir de forma intensa, com apoio do professor.",
    antes_da_atividade:
      "Combine com o aluno um sinal simples para pedir uma pausa quando sentir que está ficando frustrado (ex: levantar um cartão, erguer a mão de um jeito específico).",
    durante:
      "Ao notar sinais de frustração crescente, valide o sentimento em voz baixa e discreta (\"percebi que isso ficou difícil\") antes que a situação escale.",
    se_houver_recusa:
      "Ofereça um espaço combinado para se acalmar (um canto da sala, uma tarefa alternativa breve) em vez de insistir que o aluno continue imediatamente na mesma atividade.",
    o_que_observar:
      "Quais tipos de atividade ou situação costumam preceder os momentos de frustração mais intensa, para antecipar apoio nessas situações específicas.",
  },
  {
    dificuldade_principal: "interagir_com_colegas",
    objetivo:
      "Nas próximas 2 semanas, o aluno participa de pelo menos uma interação positiva estruturada com colegas por dia, mediada quando necessário.",
    antes_da_atividade:
      "Estruture a interação com um papel claro dentro da atividade em grupo (ex: \"você fica responsável por…\") em vez de deixar a formação de grupo totalmente livre.",
    durante:
      "Fique por perto nos primeiros minutos da interação para mediar se necessário, sem assumir a interação no lugar do aluno.",
    se_houver_recusa:
      "Comece com uma interação em dupla, com um colega já combinado, antes de propor grupos maiores.",
    o_que_observar:
      "Com quais colegas específicos a interação flui melhor, e em que tipo de atividade (livre vs. estruturada) isso acontece com mais frequência.",
  },
  {
    dificuldade_principal: "participar_em_grupo",
    objetivo:
      "Nas próximas 2 semanas, o aluno participa de atividades em grupo por períodos crescentes, com um papel definido dentro do grupo.",
    antes_da_atividade:
      "Defina com antecedência um papel específico e concreto para o aluno dentro do grupo (ex: responsável pelo material, por anotar as ideias).",
    durante:
      "Circule perto do grupo do aluno com mais frequência nos primeiros minutos, reforçando de forma discreta quando ele contribuir.",
    se_houver_recusa:
      "Permita observar a atividade por um tempo antes de participar ativamente, em vez de exigir entrada imediata na dinâmica do grupo.",
    o_que_observar:
      "Se o tamanho do grupo influencia a participação (grupos menores costumam facilitar) e em que momento da atividade o aluno costuma se afastar.",
  },
  {
    dificuldade_principal: "concluir_tarefas",
    objetivo:
      "Nas próximas 2 semanas, o aluno consegue concluir as tarefas propostas dentro do tempo combinado, com apoio de checkpoints intermediários.",
    antes_da_atividade:
      "Divida a tarefa em etapas visíveis e marque um checkpoint no meio, em vez de apresentar só o resultado final esperado.",
    durante:
      "Confira o progresso no checkpoint combinado, e reforce especificamente o que já foi feito antes de indicar o que falta.",
    se_houver_recusa:
      "Reduza o volume da tarefa mantendo o mesmo objetivo de aprendizagem, para que o aluno experimente a sensação de terminar algo.",
    o_que_observar:
      "Em que ponto da tarefa o aluno costuma desistir ou perder o ritmo, e se o tamanho da tarefa — não a dificuldade do conteúdo — está relacionado a isso.",
  },
  {
    dificuldade_principal: "lidar_com_mudancas_rotina",
    objetivo:
      "Nas próximas 2 semanas, o aluno lida com mudanças na rotina da sala com reação mais tranquila, com aviso prévio adequado.",
    antes_da_atividade:
      "Avise a mudança de rotina com a maior antecedência possível, de forma concreta (\"hoje não vamos ter educação física, vamos ter…\") em vez de anunciar em cima da hora.",
    durante:
      "Se possível, mantenha algum elemento familiar da rotina (mesmo horário de início, mesmo lugar) mesmo quando o restante muda.",
    se_houver_recusa:
      "Ofereça um apoio visual de transição (ex: um quadro de rotina do dia) que o aluno possa consultar quando sentir insegurança com a mudança.",
    o_que_observar:
      "Que tipo de mudança (de horário, de atividade, de pessoa) gera mais dificuldade, para conseguir antecipar aviso e apoio extra nesses casos.",
  },
];
