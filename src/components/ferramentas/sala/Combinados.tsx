"use client";

import { useState } from "react";
import { Plus, X, Copy, Check, Printer } from "lucide-react";
import { COMBINADOS_SUGERIDOS, CARTAZ_TITULO_PADRAO } from "@/lib/ferramentas/sala/content";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function Combinados() {
  const [titulo, setTitulo] = useState(CARTAZ_TITULO_PADRAO);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [copied, setCopied] = useState(false);

  function adicionar(texto: string) {
    const t = texto.trim();
    if (!t) return;
    setSelecionados((prev) => (prev.includes(t) ? prev : [...prev, t]));
  }

  function remover(texto: string) {
    setSelecionados((prev) => prev.filter((t) => t !== texto));
  }

  function adicionarCustom() {
    adicionar(customInput);
    setCustomInput("");
  }

  async function copiar() {
    const texto = `${titulo}\n\n${selecionados.map((t) => `• ${t}`).join("\n")}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  function imprimir() {
    const w = window.open("", "_blank", "width=820,height=920");
    if (!w) return; // pop-up bloqueado — a professora pode usar Copiar
    const itens = selecionados.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
    w.document.write(
      `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">` +
        `<title>${escapeHtml(titulo)}</title><style>` +
        `*{box-sizing:border-box;margin:0;padding:0}` +
        `body{font-family:'Poppins',system-ui,sans-serif;padding:48px;color:#212d42}` +
        `.cartaz{border:6px solid #f6614f;border-radius:24px;padding:48px 40px;max-width:640px;margin:0 auto}` +
        `h1{text-align:center;font-size:38px;color:#f6614f;margin-bottom:32px}` +
        `ul{list-style:none}` +
        `li{font-size:24px;line-height:1.5;padding:14px 0 14px 44px;position:relative;border-bottom:1px dashed #e5e7eb}` +
        `li:last-child{border-bottom:none}` +
        `li:before{content:"✓";position:absolute;left:8px;color:#71c69a;font-weight:800}` +
        `.rodape{text-align:center;margin-top:32px;color:#9ca3af;font-size:13px;letter-spacing:.1em;text-transform:uppercase}` +
        `@media print{body{padding:0}.cartaz{border-width:4px}}` +
        `</style></head><body><div class="cartaz"><h1>${escapeHtml(titulo)}</h1>` +
        `<ul>${itens}</ul><p class="rodape">Lumii</p></div>` +
        `<script>window.onload=function(){window.print()}<\/script></body></html>`
    );
    w.document.close();
  }

  const disponiveis = COMBINADOS_SUGERIDOS.filter((s) => !selecionados.includes(s));

  return (
    <div className="space-y-5">
      {/* Sugestões */}
      {disponiveis.length > 0 && (
        <div className="lumii-card p-4 sm:p-5 space-y-2">
          <p className="text-sm font-semibold text-foreground">Sugestões — toque para adicionar</p>
          <div className="flex flex-wrap gap-1.5">
            {disponiveis.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => adicionar(s)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-muted/60 text-foreground/70 hover:bg-lumii-coral/10 hover:text-lumii-coral transition-colors"
              >
                <Plus className="w-3 h-3" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Adicionar custom */}
      <div className="flex gap-2">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionarCustom();
            }
          }}
          placeholder="Escrever um combinado…"
          maxLength={120}
          className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
        />
        <button
          type="button"
          onClick={adicionarCustom}
          disabled={!customInput.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[40px] disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Cartaz */}
      <div className="lumii-card border-2 border-lumii-coral/30 p-5 sm:p-6">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full text-center text-xl sm:text-2xl font-black text-lumii-coral bg-transparent focus:outline-none focus:bg-lumii-coral/5 rounded-lg py-1 mb-4"
          aria-label="Título do cartaz"
        />
        {selecionados.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            Escolha ou escreva os combinados da turma — eles aparecem aqui no cartaz.
          </p>
        ) : (
          <ul className="space-y-1">
            {selecionados.map((t) => (
              <li
                key={t}
                className="group flex items-start gap-2 py-2.5 border-b border-dashed border-border/60 last:border-none"
              >
                <span aria-hidden className="text-primary font-bold mt-0.5 shrink-0">
                  ✓
                </span>
                <span className="flex-1 text-sm sm:text-base text-foreground/90">{t}</span>
                <button
                  type="button"
                  onClick={() => remover(t)}
                  aria-label={`Remover "${t}"`}
                  className="p-1 rounded text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Ações */}
      {selecionados.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={copiar}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-semibold border border-border hover:border-lumii-coral hover:text-lumii-coral transition-colors min-h-[44px]"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
          <button
            type="button"
            onClick={imprimir}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-semibold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      )}
    </div>
  );
}
