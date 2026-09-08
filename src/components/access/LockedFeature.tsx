import Link from "next/link";
import { Lock } from "lucide-react";
import type { Tier } from "@/lib/access/tier";
import { tierAtLeast } from "@/lib/access/tier";

// Gate de tier. SERVER COMPONENT de propósito: quando bloqueado, NÃO renderiza
// os children — o conteúdo protegido nunca chega ao client (diferente de um blur
// no client, que vazaria). Recebe o currentTier já calculado pela página (getTier).
//
// Para gate DENTRO de um client component, use tierAtLeast()/Tier de "@/lib/access/tier"
// direto e renderize condicionalmente (lembrando que gate no client é só UX, não segurança).

type RequiredTier = Exclude<Tier, "visitante" | "admin">;

type Copy = { title: string; description: string; ctaLabel: string; ctaHref: string };

const DEFAULTS: Record<RequiredTier, Copy> = {
  gratis: {
    title: "Entre para usar",
    description: "Crie sua conta grátis para acessar esta ferramenta.",
    ctaLabel: "Criar conta grátis",
    ctaHref: "/cadastro",
  },
  aluna: {
    title: "Exclusivo para alunas",
    description:
      "Adquira um curso para salvar seu trabalho aqui — seus alunos, planos e registros ficam guardados.",
    ctaLabel: "Ver cursos",
    ctaHref: "/cursos",
  },
  completo: {
    title: "Exclusivo do Lumii Completo",
    description:
      "Assine o plano anual e desbloqueie os relatórios e o acompanhamento do ano inteiro.",
    ctaLabel: "Conhecer o Lumii Completo",
    ctaHref: "/cursos",
  },
};

export function LockedFeature({
  currentTier,
  requiredTier,
  title,
  description,
  ctaLabel,
  ctaHref,
  children,
}: {
  currentTier: Tier;
  requiredTier: RequiredTier;
  /** Sobrescreve o texto padrão do tier (ex.: contexto da ferramenta específica). */
  title?: string;
  description?: string;
  ctaLabel?: string;
  /** Para `completo`, passe o link real do checkout da assinatura (annual_promo.link_url). */
  ctaHref?: string;
  children: React.ReactNode;
}) {
  if (tierAtLeast(currentTier, requiredTier)) return <>{children}</>;

  const d = DEFAULTS[requiredTier];
  return (
    <div className="lumii-card p-6 sm:p-8 flex flex-col items-center text-center gap-3">
      <div
        className="w-12 h-12 rounded-full bg-lumii-coral/15 flex items-center justify-center"
        aria-hidden
      >
        <Lock className="w-6 h-6 text-lumii-coral" />
      </div>
      <h3 className="text-lg font-bold text-foreground">{title ?? d.title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description ?? d.description}</p>
      <Link
        href={ctaHref ?? d.ctaHref}
        prefetch={false}
        className="mt-1 inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg bg-lumii-coral text-white text-sm font-semibold hover:bg-lumii-coral-hover active:bg-lumii-coral-active transition-colors"
      >
        {ctaLabel ?? d.ctaLabel}
      </Link>
    </div>
  );
}
