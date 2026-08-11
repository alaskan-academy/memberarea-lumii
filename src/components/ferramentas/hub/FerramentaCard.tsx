import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FerramentaCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  publico: "Pais" | "Professores";
  disabled?: boolean;
}

export default function FerramentaCard({
  href,
  icon: Icon,
  title,
  subtitle,
  description,
  publico,
  disabled = false,
}: FerramentaCardProps) {
  const content = (
    <div
      className={cn(
        "lumii-card p-5 sm:p-6 h-full flex flex-col gap-3",
        disabled && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-[#f6614f]/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#f6614f]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-[#71c69a]/15 text-[#4f9c72]">
          {publico}
        </span>
      </div>

      <div className="flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#f6614f] mb-1">
          {subtitle}
        </p>
        <h3 className="font-bold text-base leading-snug">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
      </div>

      {disabled ? (
        <span className="text-xs font-semibold text-muted-foreground">Em breve</span>
      ) : (
        <span className="flex items-center gap-1 text-sm font-semibold text-[#f6614f]">
          Abrir ferramenta
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </div>
  );

  if (disabled) return content;

  return (
    <Link
      href={href}
      className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f6614f] rounded-xl"
    >
      {content}
    </Link>
  );
}
