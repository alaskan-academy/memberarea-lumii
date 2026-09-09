import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Dices, Check, ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/brand/Logo";
import CadastroGratuito from "./CadastroGratuito";

/**
 * Landing pública das ferramentas grátis — a porta de entrada da Lumii para quem
 * ainda não tem conta. Mostra o que dá para fazer hoje, de graça, e pede só o
 * necessário para criar a conta. Quem já está logada vai direto para as
 * ferramentas.
 *
 * Foco em professores: as duas ferramentas gratuitas (Parecer descritivo e Sala
 * de aula) são de sala de aula. Pais também podem criar conta — veem essas duas
 * abertas e o restante como caminho de compra.
 */

export const metadata = {
  title: "Ferramentas grátis para quem dá aula | Lumii",
  description:
    "Pareceres de boletim prontos e utilitários para a sala de aula. Ferramentas grátis da Lumii, sem cartão e sem prazo.",
};

const FERRAMENTAS = [
  {
    icone: FileText,
    nome: "Parecer descritivo",
    frase: "Comentário de boletim pronto",
    texto:
      "Marque como o aluno está em cada aspecto — participação, autonomia, convivência e mais — e gere um parecer humanizado, pronto para revisar e copiar.",
    exemplo: "8 aspectos avaliados → parecer pronto pra copiar",
  },
  {
    icone: Dices,
    nome: "Sala de aula",
    frase: "Sorteio, cronômetro e combinados",
    texto:
      "Utilitários ao vivo para usar na hora: sortear um aluno ou formar grupos, cronômetro visual com alarme e o cartaz de combinados da turma. Nada fica salvo.",
    exemplo: "Sortear alunos · cronômetro · cartaz de combinados",
  },
];

export default async function ComecarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/ferramentas");

  return (
    <div className="min-h-screen bg-lumii-bg">
      <header className="px-4 pt-10 pb-2 sm:pt-14">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-5">
          <Logo size={52} />
          <h1 className="text-[26px] sm:text-4xl font-bold text-lumii-muted leading-[1.15] max-w-xl">
            Ferramentas <span className="text-lumii-coral">grátis</span> para quem dá aula
          </h1>
          <p className="text-base sm:text-lg text-lumii-muted/70 leading-relaxed max-w-lg">
            Pareceres de boletim prontos e utilitários para a sala de aula. Em minutos, sem cartão e sem prazo.
          </p>
        </div>
      </header>

      <section id="criar-conta" className="px-4 pb-2 scroll-mt-4">
        <div className="max-w-md mx-auto">
          <div className="lumii-card p-6 sm:p-7 space-y-5 text-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lumii-green/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-lumii-navy">
                Grátis para sempre
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-lumii-navy leading-tight mt-3">
                Crie sua conta e use agora
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Leva um minuto. As ferramentas abrem na hora.
              </p>
            </div>
            <CadastroGratuito />
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:py-14">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-center text-lg sm:text-xl font-bold text-lumii-muted mb-1">
            O que você recebe, de graça
          </h2>
          {FERRAMENTAS.map((f) => {
            const Icone = f.icone;
            return (
              <div key={f.nome} className="lumii-card p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-lumii-coral/10 border border-lumii-coral/20 flex items-center justify-center">
                    <Icone className="w-6 h-6 text-lumii-coral" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-lumii-navy leading-tight">{f.nome}</h3>
                    <p className="text-sm font-semibold text-lumii-coral mt-0.5">{f.frase}</p>
                    <p className="text-[15px] text-muted-foreground leading-relaxed mt-2">{f.texto}</p>
                    <p className="mt-3 inline-block rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold text-foreground/80">
                      {f.exemplo}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-2">
        <div className="max-w-2xl mx-auto text-center">
          <a
            href="#criar-conta"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-lumii-coral text-white text-base font-bold px-7 min-h-[56px] hover:bg-lumii-coral-hover transition-colors"
          >
            Criar minha conta grátis <ArrowUp className="w-4 h-4" />
          </a>
        </div>
      </section>

      <section className="px-4 pt-12 pb-14">
        <div className="max-w-2xl mx-auto bg-lumii-bg-surface text-lumii-muted rounded-2xl p-6 sm:p-8 space-y-4 border border-white/5">
          <h2 className="text-lg sm:text-xl font-bold leading-tight">E quando quiser se aprofundar</h2>
          <p className="text-[15px] text-lumii-muted/80 leading-relaxed">
            As ferramentas resolvem o dia a dia. Os cursos vão além: formação para quem cuida da infância, com aula
            em vídeo, comunidade e certificado.
          </p>
          <ul className="space-y-2">
            {[
              "Aula em vídeo, no seu tempo, quantas vezes quiser",
              "Comunidade para trocar com outros educadores",
              "Certificado com o seu nome ao concluir",
            ].map((i) => (
              <li key={i} className="flex items-start gap-2 text-[15px]">
                <Check className="w-4 h-4 text-lumii-green shrink-0 mt-1" />
                <span className="text-lumii-muted/85">{i}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-lumii-muted/60">Crie a conta primeiro e conheça os cursos por dentro, sem compromisso.</p>
        </div>
      </section>

      <footer className="px-4 pb-12">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs text-lumii-muted/50 leading-relaxed">
            Lumii — cuidar de quem cuida da infância.
            <br />
            Já tem conta?{" "}
            <Link href="/login" className="text-lumii-coral font-semibold underline-offset-4 hover:underline">
              Entrar na sua conta
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
