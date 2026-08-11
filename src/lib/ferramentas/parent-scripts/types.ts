export type Situacao =
  | "nao_quer_dormir"
  | "fazendo_birra"
  | "bateu_no_irmao"
  | "nao_quer_ir_escola"
  | "nao_quer_guardar_brinquedos"
  | "mentiu"
  | "esta_com_medo"
  | "esta_chorando"
  | "nao_aceita_desligar_celular"
  | "falou_desrespeitoso";

export type FaixaEtaria = "2_4" | "5_7" | "8_10" | "11_13" | "14_17";

export interface ParentScriptInput {
  situacao: Situacao;
  idade_crianca: number; // 0-17, convertido para FaixaEtaria na UI
}

export interface ParentScriptEntry {
  key: string; // "{situacao}__{faixa_etaria}"
  situacao: Situacao;
  faixa_etaria: FaixaEtaria;
  validacao: string;
  limite: string;
  escolha: string;
  se_persistir: string;
  evitar: { frase: string; motivo: string };
}

export const SITUACOES: { value: Situacao; label: string; emoji: string }[] = [
  { value: "nao_quer_dormir", label: "Não quer dormir", emoji: "😴" },
  { value: "fazendo_birra", label: "Fazendo birra", emoji: "😤" },
  { value: "bateu_no_irmao", label: "Bateu no irmão/irmã", emoji: "✋" },
  { value: "nao_quer_ir_escola", label: "Não quer ir à escola", emoji: "🎒" },
  { value: "nao_quer_guardar_brinquedos", label: "Não quer guardar os brinquedos", emoji: "🧸" },
  { value: "mentiu", label: "Mentiu", emoji: "🤥" },
  { value: "esta_com_medo", label: "Está com medo", emoji: "😨" },
  { value: "esta_chorando", label: "Está chorando muito", emoji: "😢" },
  { value: "nao_aceita_desligar_celular", label: "Não aceita desligar o celular/TV", emoji: "📱" },
  { value: "falou_desrespeitoso", label: "Falou de forma desrespeitosa", emoji: "💢" },
];

export const FAIXAS_ETARIAS: { value: FaixaEtaria; label: string; min: number; max: number }[] = [
  { value: "2_4", label: "2 a 4 anos", min: 2, max: 4 },
  { value: "5_7", label: "5 a 7 anos", min: 5, max: 7 },
  { value: "8_10", label: "8 a 10 anos", min: 8, max: 10 },
  { value: "11_13", label: "11 a 13 anos", min: 11, max: 13 },
  { value: "14_17", label: "14 a 17 anos", min: 14, max: 17 },
];

export function idadeParaFaixa(idade: number): FaixaEtaria | null {
  const faixa = FAIXAS_ETARIAS.find((f) => idade >= f.min && idade <= f.max);
  return faixa?.value ?? null;
}

export function scriptKey(situacao: Situacao, faixa: FaixaEtaria): string {
  return `${situacao}__${faixa}`;
}

export const DISCLAIMER_PARENT_SCRIPT =
  "Se essa situação está muito frequente ou intensa e te preocupa, vale conversar com um profissional (pediatra ou psicólogo infantil).";
