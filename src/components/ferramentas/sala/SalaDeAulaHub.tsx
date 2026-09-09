"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Shuffle, Timer, ScrollText, type LucideIcon } from "lucide-react";
import Sorteio from "./Sorteio";
import Cronometro from "./Cronometro";
import Combinados from "./Combinados";

type View = "menu" | "sorteio" | "cronometro" | "combinados";

const FERRAMENTAS: { key: Exclude<View, "menu">; title: string; desc: string; icon: LucideIcon }[] = [
  { key: "sorteio", title: "Sorteio", desc: "Sortear um aluno ou formar grupos", icon: Shuffle },
  { key: "cronometro", title: "Cronômetro", desc: "Tempo regressivo visual e cronômetro", icon: Timer },
  { key: "combinados", title: "Combinados", desc: "Monte o cartaz de combinados da turma", icon: ScrollText },
];

export default function SalaDeAulaHub() {
  const [view, setView] = useState<View>("menu");

  const ativa = FERRAMENTAS.find((f) => f.key === view);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {view === "menu" ? (
        <>
          <Link
            href="/ferramentas"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Ferramentas
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold">Sala de aula</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Utilitários ao vivo para usar na hora — nada fica salvo.
            </p>
          </div>

          <div className="space-y-3">
            {FERRAMENTAS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setView(f.key)}
                className="lumii-card p-4 sm:p-5 w-full flex items-center gap-4 text-left hover:border-lumii-coral/40 transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-lumii-coral/12 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-lumii-coral" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{f.title}</p>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-lumii-coral transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setView("menu")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Sala de aula
          </button>

          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {ativa && <ativa.icon className="w-6 h-6 text-lumii-coral" />}
            {ativa?.title}
          </h1>

          {view === "sorteio" && <Sorteio />}
          {view === "cronometro" && <Cronometro />}
          {view === "combinados" && <Combinados />}
        </>
      )}
    </div>
  );
}
