import Link from "next/link";
import { ChevronRight, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FerramentaCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  publico: "Pais" | "Professores";
  disabled?: boolean;
  // Bloqueada por categoria/tier: o card aparece, mostra que é da categoria e
  // leva ao catálogo (não à ferramenta).
  locked?: boolean;
}

export default function FerramentaCard({
  href,
  icon: Icon,
  title,
  subtitle,
  description,
  publico,
  disabled = false,
  locked = false,
}: FerramentaCardProps) {
  const content = (
    <div
      className={cn(
        "lumii-card p-5 sm:p-6 h-full flex flex-col gap-3",
        (disabled || locked) && "opacity-75"
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
            locked ? "bg-muted" : "bg-lumii-coral/10"
          )}
        >
          <Icon className={cn("w-5 h-5", locked ? "text-muted-foreground" : "text-lumii-coral")} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-lumii-green/15 text-[#4f9c72]">
          {publico}
        </span>
      </div>

      <div className="flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-lumii-coral mb-1">
          {subtitle}
        </p>
        <h3 className="font-bold text-base leading-snug">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
      </div>

      {disabled ? (
        <span className="text-xs font-semibold text-muted-foreground">Em breve</span>
      ) : locked ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Lock className="w-3.5 h-3.5" />
          Disponível com um curso de {publico}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-sm font-semibold text-lumii-coral">
          Abrir ferramenta
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </div>
  );

  if (disabled) return content;

  // Bloqueada → leva ao catálogo (upsell). Acessível → abre a ferramenta.
  return (
    <Link
      href={locked ? "/cursos" : href}
      prefetch={false}
      className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-lumii-coral rounded-xl"
    >
      {content}
    </Link>
  );
}
