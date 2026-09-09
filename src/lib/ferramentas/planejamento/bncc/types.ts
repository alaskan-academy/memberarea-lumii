// Planejador BNCC — tipos + referência de componentes/bimestres.

export interface YearPlanRow {
  id: string;
  titulo: string;
  ano: number;
  bimestre: number; // 0 = anual, 1–4 = bimestre
  componente: string | null;
  bncc_codes: string[];
  texto: string;
  created_at: string;
  updated_at: string;
}

// Componentes curriculares da BNCC (Ensino Fundamental) — ajudam a professora a
// montar/entender os códigos (ex.: EF03MA05 = 3º ano, Matemática, habilidade 05).
// Não é a base de habilidades inteira (milhares) — só a referência dos componentes.
export const BNCC_COMPONENTES: { code: string; label: string }[] = [
  { code: "LP", label: "Língua Portuguesa" },
  { code: "MA", label: "Matemática" },
  { code: "CI", label: "Ciências" },
  { code: "GE", label: "Geografia" },
  { code: "HI", label: "História" },
  { code: "AR", label: "Arte" },
  { code: "EF", label: "Educação Física" },
  { code: "LI", label: "Língua Inglesa" },
  { code: "ER", label: "Ensino Religioso" },
];

export const BIMESTRES: { value: number; label: string }[] = [
  { value: 0, label: "Ano todo" },
  { value: 1, label: "1º bimestre" },
  { value: 2, label: "2º bimestre" },
  { value: 3, label: "3º bimestre" },
  { value: 4, label: "4º bimestre" },
];

export function bimestreLabel(b: number): string {
  return BIMESTRES.find((x) => x.value === b)?.label ?? "Ano todo";
}
