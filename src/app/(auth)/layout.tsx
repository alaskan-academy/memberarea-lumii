import type { ReactNode } from "react";
import Logo from "@/components/brand/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-lumii-bg">
      {/* Faixa Lumii no topo */}
      <div className="brand-stripe">
        <span /><span /><span />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo Lumii */}
          <div className="flex flex-col items-center gap-3">
            <Logo size={56} />
            <span className="text-xs text-lumii-muted/60 tracking-wide">
              Cuidar de quem cuida da infância.
            </span>
          </div>

          {children}
        </div>
      </div>

      {/* Rodapé */}
      <footer className="py-4 text-center text-xs text-lumii-muted/40 border-t border-border/40">
        © {new Date().getFullYear()} Lumii — Todos os direitos reservados
      </footer>
    </div>
  );
}
