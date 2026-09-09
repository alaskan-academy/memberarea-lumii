"use client";

import { useState } from "react";
import { Copy, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ASPECTOS,
  NIVEIS,
  type AspectoKey,
  type Nivel,
} from "@/lib/ferramentas/parecer/content";
import { buildParecer } from "@/lib/ferramentas/parecer/build";
import AutoGrowTextarea from "@/components/ferramentas/support-plan/AutoGrowTextarea";

export default function ParecerTool() {
  const [nome, setNome] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [aspectos, setAspectos] = useState<Partial<Record<AspectoKey, Nivel>>>({});
  const [observacao, setObservacao] = useState("");
  const [resultado, setResultado] = useState("");
  const [copiado, setCopiado] = useState(false);

  const selecionados = Object.keys(aspectos).length;

  function setNivel(key: AspectoKey, nivel: Nivel) {
    setAspectos((prev) => {
      const next = { ...prev };
      if (prev[key] === nivel) delete next[key]; // clicar no mesmo desmarca
      else next[key] = nivel;
      return next;
    });
    setResultado("");
  }

  function gerar() {
    setResultado(buildParecer({ nome, periodo, aspectos, observacao }));
    setCopiado(false);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(resultado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível — o texto segue editável para copiar na mão */
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div>
        <p className="text-sm font-medium text-lumii-coral uppercase tracking-wide mb-1">Ferramenta</p>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-lumii-coral shrink-0" />
          Parecer descritivo
        </h1>
        <p className="text-muted-foreground mt-1">
          Marque como o aluno está em cada aspecto e gere um parecer pronto para o boletim — é só revisar e copiar.
        </p>
      </div>

      {/* Aluno + período */}
      <div className="lumii-card p-5 grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="parecer-nome" className="block text-xs font-medium text-foreground/70">
            Nome do aluno <span className="text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="parecer-nome"
            value={nome}
            onChange={(e) => { setNome(e.target.value); setResultado(""); }}
            placeholder="Ex.: Maria"
            maxLength={80}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lumii-coral/30"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="parecer-periodo" className="block text-xs font-medium text-foreground/70">
            Período <span className="text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="parecer-periodo"
            value={periodo}
            onChange={(e) => { setPeriodo(e.target.value); setResultado(""); }}
            placeholder="Ex.: 1º bimestre"
            maxLength={40}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lumii-coral/30"
          />
        </div>
      </div>

      {/* Aspectos */}
      <div className="lumii-card p-5 space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold text-sm text-foreground">Como o aluno está em cada aspecto?</h2>
          <span className="text-xs text-muted-foreground">{selecionados} marcado(s)</span>
        </div>
        <p className="text-xs text-muted-foreground">Marque só os que quiser incluir. Clique de novo para desmarcar.</p>

        <div className="divide-y divide-border/50">
          {ASPECTOS.map((a) => (
            <div key={a.key} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="sm:flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {NIVEIS.map((n) => {
                  const active = aspectos[a.key] === n.key;
                  return (
                    <button
                      key={n.key}
                      type="button"
                      onClick={() => setNivel(a.key, n.key)}
                      title={n.hint}
                      aria-pressed={active}
                      className={cn(
                        "px-2.5 min-h-[36px] rounded-lg text-xs font-semibold border transition-colors",
                        active
                          ? "bg-lumii-coral text-white border-lumii-coral"
                          : "border-border text-muted-foreground hover:border-lumii-coral/50 hover:text-foreground"
                      )}
                    >
                      {n.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observação livre */}
      <div className="lumii-card p-5 space-y-1.5">
        <label htmlFor="parecer-obs" className="block text-xs font-medium text-foreground/70">
          Observação livre <span className="text-muted-foreground">(opcional — entra no fim do texto)</span>
        </label>
        <AutoGrowTextarea
          id="parecer-obs"
          value={observacao}
          onChange={(v) => { setObservacao(v); setResultado(""); }}
          placeholder="Algo específico deste aluno que você queira registrar…"
          maxLength={500}
          maxHeight={160}
          style={{ minHeight: "44px" }}
        />
      </div>

      <button
        onClick={gerar}
        disabled={selecionados === 0}
        className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] rounded-lg bg-lumii-coral text-white text-sm font-semibold hover:bg-lumii-coral-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <FileText className="w-4 h-4" />
        Gerar parecer
      </button>

      {/* Resultado */}
      {resultado && (
        <div className="lumii-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-foreground">Parecer gerado</h2>
            <button
              onClick={copiar}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg bg-lumii-coral/10 text-lumii-coral text-xs font-semibold hover:bg-lumii-coral/15 transition-colors"
            >
              {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiado ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <AutoGrowTextarea
            value={resultado}
            onChange={setResultado}
            aria-label="Texto do parecer (editável)"
            maxHeight={9999}
            className="text-sm leading-relaxed"
          />
          <p className="text-[11px] text-muted-foreground">
            Revise e ajuste como quiser antes de usar — o texto acima é editável.
          </p>
        </div>
      )}
    </div>
  );
}
