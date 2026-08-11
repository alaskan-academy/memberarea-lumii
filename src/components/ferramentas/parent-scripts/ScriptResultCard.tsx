"use client";

import { useEffect, useRef } from "react";
import { CheckCircle, ShieldAlert, SplitSquareHorizontal, RotateCcw, XCircle } from "lucide-react";
import type { ParentScriptEntry } from "@/lib/ferramentas/parent-scripts/types";
import { DISCLAIMER_PARENT_SCRIPT } from "@/lib/ferramentas/parent-scripts/types";
import { logParentScriptView } from "@/lib/ferramentas/parent-scripts/actions";
import FavoritoButton from "./FavoritoButton";
import CopiarTextoButton from "./CopiarTextoButton";

function scriptToPlainText(entry: ParentScriptEntry): string {
  return [
    `Primeiro diga: "${entry.validacao}"`,
    `Depois coloque o limite: "${entry.limite}"`,
    `Dê uma escolha possível: "${entry.escolha}"`,
    `Se continuar recusando: "${entry.se_persistir}"`,
    `Evite dizer: "${entry.evitar.frase}"`,
    `→ ${entry.evitar.motivo}`,
  ].join("\n\n");
}

export default function ScriptResultCard({
  entry,
  favorited,
  logView = true,
}: {
  entry: ParentScriptEntry;
  favorited: boolean;
  logView?: boolean;
}) {
  const logged = useRef(false);

  useEffect(() => {
    if (!logView || logged.current) return;
    logged.current = true;
    logParentScriptView(entry.key);
  }, [entry.key, logView]);

  return (
    <div className="lumii-card p-5 sm:p-6 space-y-5">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#71c69a] mb-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          Primeiro diga
        </p>
        <p className="text-base font-semibold leading-snug">&ldquo;{entry.validacao}&rdquo;</p>
      </div>

      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#f6614f] mb-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          Depois coloque o limite
        </p>
        <p className="text-base font-semibold leading-snug">&ldquo;{entry.limite}&rdquo;</p>
      </div>

      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#eebc3e] mb-1.5">
          <SplitSquareHorizontal className="w-3.5 h-3.5" />
          Dê uma escolha possível
        </p>
        <p className="text-base font-semibold leading-snug">&ldquo;{entry.escolha}&rdquo;</p>
      </div>

      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          Se continuar recusando
        </p>
        <p className="text-base font-semibold leading-snug">&ldquo;{entry.se_persistir}&rdquo;</p>
      </div>

      <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-500 mb-1.5">
          <XCircle className="w-3.5 h-3.5" />
          Evite dizer
        </p>
        <p className="text-sm font-medium leading-snug">&ldquo;{entry.evitar.frase}&rdquo;</p>
        <p className="text-sm text-muted-foreground mt-1.5">→ {entry.evitar.motivo}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <FavoritoButton scriptKey={entry.key} initialFavorited={favorited} />
        <CopiarTextoButton text={scriptToPlainText(entry)} />
      </div>

      <p className="text-xs text-muted-foreground border-t border-border/60 pt-4">
        {DISCLAIMER_PARENT_SCRIPT}
      </p>
    </div>
  );
}
