import { redirect } from "next/navigation";

/**
 * Alguém acessou /login/<email> — rota que não existia e dava 404 (ex.: admin
 * ou aluna digitando a URL na mão). Encaminha para a tela de login com o e-mail
 * já preenchido (`/login?email=<email>`), que a própria página de login lê e
 * usa para pré-preencher o campo.
 */
export default async function LoginComEmailRedirect({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email } = await params;
  redirect(`/login?email=${encodeURIComponent(email)}`);
}
