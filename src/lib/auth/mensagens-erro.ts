// Traduz mensagens de erro do Supabase Auth (que chegam SEMPRE em inglês) para
// PT-BR, com foco no caminho de quem acabou de comprar (cadastro/ativação/nova
// senha). Retorna `null` quando não reconhece o erro — aí o caller usa o próprio
// fallback genérico.
//
// O caso mais importante é senha fraca/vazada: com a proteção de "leaked
// password" do Supabase ligada, uma senha longa porém comum/vazada é recusada,
// e sem tradução a aluna via "Erro ao criar conta" (cadastro) ou "O link pode
// ter expirado" (nova senha) — mensagens que escondem o motivo real.
export function traduzErroAuth(raw: string | undefined | null): string | null {
  const m = (raw ?? "").toLowerCase();
  if (!m) return null;

  // Senha fraca ou já vazada (leaked/weak password protection)
  if (
    m.includes("weak") ||
    m.includes("easy to guess") ||
    m.includes("pwned") ||
    m.includes("leaked") ||
    m.includes("compromised") ||
    m.includes("data breach")
  ) {
    return "Essa senha é muito fraca ou já apareceu em vazamentos. Escolha uma senha mais forte e única (evite senhas óbvias).";
  }

  // Senha curta demais
  if (m.includes("password") && m.includes("at least")) {
    return "A senha é muito curta. Use pelo menos 8 caracteres.";
  }

  // E-mail já cadastrado
  if (
    m.includes("already registered") ||
    m.includes("already exists") ||
    m.includes("already been registered")
  ) {
    return "Este e-mail já está cadastrado. Tente fazer login.";
  }

  // Nova senha igual à atual
  if (
    m.includes("should be different") ||
    m.includes("same as the old") ||
    m.includes("different from the old") ||
    (m.includes("same") && m.includes("password"))
  ) {
    return "A nova senha precisa ser diferente da atual.";
  }

  // Credenciais inválidas / e-mail não confirmado (login)
  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  // Link/token de recuperação ou ativação expirado/inválido
  if (m.includes("expired") || (m.includes("invalid") && m.includes("token"))) {
    return "O link expirou ou é inválido. Solicite um novo.";
  }

  return null;
}
