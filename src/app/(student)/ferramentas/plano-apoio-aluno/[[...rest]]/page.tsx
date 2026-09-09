import { redirect } from "next/navigation";

// Rota antiga: a ferramenta "Plano de Apoio" virou "Meus Alunos" (a ficha do
// aluno agora tem abas: Diário + Plano de apoio). Redireciona qualquer link
// antigo — incluindo /aluno/[id] e /turma/[id] — para o novo caminho.
export default async function LegacyPlanoApoioRedirect({
  params,
}: {
  params: Promise<{ rest?: string[] }>;
}) {
  const { rest } = await params;
  const suffix = rest?.length ? `/${rest.join("/")}` : "";
  redirect(`/ferramentas/meus-alunos${suffix}`);
}
