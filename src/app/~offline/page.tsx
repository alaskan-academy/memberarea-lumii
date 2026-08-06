"use client";

import Logo from "@/components/brand/Logo";

export default function OfflinePage() {
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
            Você está{" "}
            <span className="text-[#f6614f]">sem conexão</span>
          </h1>
          <p className="text-sm text-lumii-muted/70 leading-relaxed">
            Parece que a internet sumiu por aqui. Verifique sua conexão e tente
            novamente — seus cursos estarão te esperando!
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-10 inline-flex items-center gap-2 rounded-lg bg-[#f6614f] px-6 py-3 text-sm font-semibold text-white min-h-[44px] transition-opacity hover:opacity-90 active:opacity-75"
        >
          Tentar novamente
        </button>
      </div>

      {/* Rodapé */}
      <div className="py-6 border-t border-lumii-muted/10 text-center text-xs text-lumii-muted/40 tracking-wide uppercase">
        Lumii · Cuidar de quem cuida da infância.
      </div>
    </div>
  );
}
