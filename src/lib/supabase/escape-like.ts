// Escapa os curingas do LIKE/ILIKE (% e _) e a própria barra de escape (\) para
// que o termo digitado seja buscado LITERALMENTE. Sem isto, digitar "%" vira
// curinga total e a busca retorna tudo; "_" casa qualquer caractere. Assume o
// ESCAPE padrão do Postgres ('\').
//
// Use sempre que interpolar entrada do usuário em `.ilike()` ou em padrões
// ilike dentro de `.or(...)`.
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
