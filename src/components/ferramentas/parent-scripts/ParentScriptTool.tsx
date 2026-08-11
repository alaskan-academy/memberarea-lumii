"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Star } from "lucide-react";
import {
  idadeParaFaixa,
  scriptKey,
  SITUACOES,
  type Situacao,
} from "@/lib/ferramentas/parent-scripts/types";
import { PARENT_SCRIPTS } from "@/lib/ferramentas/parent-scripts/content";
import SituacaoGrid from "./SituacaoGrid";
import IdadeSelector from "./IdadeSelector";
import ScriptResultCard from "./ScriptResultCard";

export default function ParentScriptTool({ initialFavorites }: { initialFavorites: string[] }) {
  const [situacao, setSituacao] = useState<Situacao | null>(null);
  const [idade, setIdade] = useState<number | null>(null);
  const favoritesSet = useMemo(() => new Set(initialFavorites), [initialFavorites]);

  const entry = useMemo(() => {
    if (!situacao || idade === null) return undefined;
    const faixa = idadeParaFaixa(idade);
    if (!faixa) return null; // idade fora do intervalo coberto (0-1 anos)
    const key = scriptKey(situacao, faixa);
    return PARENT_SCRIPTS.find((s) => s.key === key) ?? undefined;
  }, [situacao, idade]);

  function reset() {
    setSituacao(null);
    setIdade(null);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/ferramentas"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Ferramentas
        </Link>
        <Link
          href="/ferramentas/o-que-eu-digo-agora/favoritos"
          className="flex items-center gap-1.5 text-sm font-medium text-[#f6614f] hover:underline"
        >
          <Star className="w-3.5 h-3.5" />
          Meus favoritos
        </Link>
      </div>

      {!situacao && <SituacaoGrid onSelect={setSituacao} />}

      {situacao && idade === null && (
        <IdadeSelector situacao={situacao} onBack={reset} onConfirm={setIdade} />
      )}

      {situacao && idade !== null && (
        <div>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Escolher outra situação
          </button>

          {entry === null && (
            <div className="lumii-card p-6 text-center space-y-2">
              <p className="text-2xl">🧸</p>
              <p className="font-semibold">Essas situações são pensadas a partir dos 2 anos.</p>
              <p className="text-sm text-muted-foreground">
                Para bebês de 0 e 1 ano, o mais importante é acolher — ainda não há uma
                &ldquo;conversa&rdquo; possível nessa fase.
              </p>
            </div>
          )}

          {entry === undefined && (
            <div className="lumii-card p-6 text-center space-y-2">
              <p className="font-semibold">{SITUACOES.find((s) => s.value === situacao)?.label}</p>
              <p className="text-sm text-muted-foreground">
                Ainda não temos um script pronto para essa combinação — em breve isso muda.
              </p>
            </div>
          )}

          {entry && <ScriptResultCard entry={entry} favorited={favoritesSet.has(entry.key)} />}
        </div>
      )}
    </div>
  );
}
