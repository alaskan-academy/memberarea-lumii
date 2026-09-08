"use client";

import { useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-h-svh bg-lumii-bg flex flex-col"
      style={{ fontFamily: "var(--font-poppins), Poppins, Arial, sans-serif" }}
    >
      {/* Conteúdo central */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <Logo size={64} />

        <div className="mt-10 space-y-3 max-w-sm">
          <h1 className="text-xl font-bold text-lumii-muted">
            Algo deu <span className="text-lumii-coral">errado</span>
          </h1>
          <p className="text-sm text-lumii-muted/70 leading-relaxed">
            Tivemos um problema inesperado por aqui. Tente novamente — se o
            erro continuar, volte para seus cursos.
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-lumii-coral px-6 py-3 text-sm font-semibold text-white min-h-[44px] transition-opacity hover:opacity-90 active:opacity-75"
          >
            Tentar novamente
          </button>
          <Link
            href="/cursos"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-lumii-muted/20 px-6 py-3 text-sm font-semibold text-lumii-muted min-h-[44px] transition-colors hover:bg-lumii-muted/5"
          >
            Ir para meus cursos
          </Link>
        </div>
      </div>

      {/* Rodapé */}
      <div className="py-6 border-t border-lumii-muted/10 text-center text-xs text-lumii-muted/40 tracking-wide uppercase">
        Lumii · Cuidar de quem cuida da infância.
      </div>
    </div>
  );
}
