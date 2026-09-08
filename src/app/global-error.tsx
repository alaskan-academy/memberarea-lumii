"use client";

// Captura falhas no PRÓPRIO root layout (o error.tsx da raiz roda dentro do
// layout, então não cobre um crash nele). Substitui a árvore inteira, então
// precisa emitir seu próprio <html>/<body> e NÃO pode depender do CSS global /
// Tailwind nem de componentes com contexto — tudo em estilo inline, cores da IDV.
import { useEffect } from "react";

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
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#243149",
          color: "#F5F5F0",
          fontFamily: "Poppins, system-ui, Arial, sans-serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#f6614f" }}>
            Lumii
          </div>

          <h1 style={{ marginTop: 40, marginBottom: 0, fontSize: 22, fontWeight: 700 }}>
            Algo deu <span style={{ color: "#f6614f" }}>errado</span>
          </h1>
          <p
            style={{
              marginTop: 12,
              maxWidth: 360,
              fontSize: 14,
              lineHeight: 1.6,
              color: "rgba(245,245,240,0.7)",
            }}
          >
            Tivemos um problema inesperado por aqui. Tente novamente — se o erro continuar,
            recarregue a página.
          </p>

          <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                minHeight: 44,
                padding: "0 24px",
                borderRadius: 8,
                border: "none",
                background: "#f6614f",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
            <a
              href="/cursos"
              style={{
                minHeight: 44,
                padding: "12px 24px",
                borderRadius: 8,
                border: "1px solid rgba(245,245,240,0.2)",
                color: "#F5F5F0",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Ir para meus cursos
            </a>
          </div>
        </div>

        <div
          style={{
            padding: 24,
            borderTop: "1px solid rgba(245,245,240,0.1)",
            textAlign: "center",
            fontSize: 12,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "rgba(245,245,240,0.4)",
          }}
        >
          Lumii · Cuidar de quem cuida da infância.
        </div>
      </body>
    </html>
  );
}
