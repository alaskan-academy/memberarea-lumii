import { ASPECTOS, FRASES, FECHAMENTO, type ParecerInput } from "./content";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Monta o texto do parecer a partir das escolhas da professora. Função PURA
 * (sem IA, sem rede) — este é o ponto de extensão caso IA entre no futuro.
 * Devolve "" se nenhum aspecto foi incluído.
 */
export function buildParecer(input: ParecerInput): string {
  const nome = input.nome.trim() || "o(a) estudante";
  const periodo = input.periodo.trim();

  const frases = ASPECTOS.filter((a) => input.aspectos[a.key]).map(
    (a) => FRASES[a.key][input.aspectos[a.key]!]
  );
  if (frases.length === 0) return "";

  const abertura = periodo
    ? `Ao longo do ${periodo}, ${nome} `
    : `${capitalize(nome)} `;

  let texto = abertura + frases.join("; ") + ".";

  const obs = input.observacao?.trim();
  if (obs) texto += " " + obs + (/[.!?]$/.test(obs) ? "" : ".");

  texto += " " + FECHAMENTO;
  return texto;
}
