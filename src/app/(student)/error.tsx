"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home } from "lucide-react";

export default function StudentError({
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
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center min-h-[60svh]">
      <div className="space-y-3 max-w-sm">
        <h1 className="text-xl font-bold">
          Algo saiu do <span className="text-lumii-coral">lugar</span> por aqui
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tivemos um problema inesperado. Tente novamente — se continuar, volte
          para a sua jornada.
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-lumii-coral px-6 py-3 text-sm font-semibold text-white min-h-[44px] transition-colors hover:bg-lumii-coral-hover active:bg-lumii-coral-active"
        >
          <RotateCcw className="w-4 h-4" />
          Tentar de novo
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground min-h-[44px] transition-colors hover:bg-muted"
        >
          <Home className="w-4 h-4" />
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
