// Paginação para contornar o limite de 1.000 linhas por request do Supabase/
// PostgREST — que é aplicado EM SILÊNCIO (sem erro). Qualquer leitura que
// AGREGA ou CONTA em JS sobre a tabela inteira deve usar isto; caso contrário
// a conta fica errada e menor assim que a tabela passa de mil linhas.
//
// Quando só o TOTAL importa (sem precisar das linhas em si), prefira uma única
// query com `.select("*", { count: "exact", head: true })` em vez de paginar.

const PAGE_SIZE = 1000;

/**
 * Recebe uma FÁBRICA de query, chamada a cada página para reaplicar `.range()`.
 * A query DEVE incluir um `.order()` determinístico (ex.: `.order("id")`) para
 * não pular nem duplicar linhas entre páginas.
 *
 * @example
 * const rows = await fetchAll<{ user_id: string; completed: boolean }>((from, to) =>
 *   supabase.from("lesson_progress").select("user_id, completed").order("id").range(from, to)
 * );
 */
export async function fetchAll<T>(
  makeQuery: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await makeQuery(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`fetchAll: ${error.message}`);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return all;
}
