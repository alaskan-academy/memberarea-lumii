"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Check, Plus, GripVertical } from "lucide-react";
import {
  ESCALA_PADRAO,
  type RubricCriterio,
  type RubricRow,
} from "@/lib/ferramentas/planejamento/rubricas/types";
import { createRubric, updateRubric } from "@/lib/ferramentas/planejamento/rubricas/actions";

function novoId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `c-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }
}

export default function RubricForm({
  initial,
  onDone,
}: {
  initial: RubricRow | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [escala, setEscala] = useState<string[]>(initial?.escala?.length ? initial.escala : [...ESCALA_PADRAO]);
  const [itens, setItens] = useState<RubricCriterio[]>(
    initial?.itens?.length ? initial.itens : [{ id: novoId(), nome: "" }]
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setNivel(i: number, v: string) {
    setEscala((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  }
  function addNivel() {
    setEscala((prev) => (prev.length >= 6 ? prev : [...prev, ""]));
  }
  function removeNivel(i: number) {
    setEscala((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  function setItem(id: string, nome: string) {
    setItens((prev) => prev.map((it) => (it.id === id ? { ...it, nome } : it)));
  }
  function addItem() {
    setItens((prev) => (prev.length >= 30 ? prev : [...prev, { id: novoId(), nome: "" }]));
  }
  function removeItem(id: string) {
    setItens((prev) => (prev.length <= 1 ? prev : prev.filter((it) => it.id !== id)));
  }

  function handleSave() {
    const escalaLimpa = escala.map((s) => s.trim()).filter(Boolean);
    const itensLimpos = itens.map((it) => ({ id: it.id, nome: it.nome.trim() })).filter((it) => it.nome);
    if (!titulo.trim()) return setError("Dê um título à rubrica");
    if (escalaLimpa.length < 2) return setError("A escala precisa de ao menos 2 níveis");
    if (itensLimpos.length < 1) return setError("Adicione ao menos um critério");
    setError(null);
    startTransition(async () => {
      const payload = { titulo: titulo.trim(), escala: escalaLimpa, itens: itensLimpos };
      const res = initial ? await updateRubric({ id: initial.id, ...payload }) : await createRubric(payload);
      if (res.error) {
        setError(res.error);
        return;
      }
      onDone();
      router.refresh();
    });
  }

  return (
    <div className="lumii-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{initial ? "Editar rubrica" : "Nova rubrica"}</p>
        <button type="button" onClick={onDone} aria-label="Fechar" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título — ex.: Apresentação de trabalho"
        maxLength={200}
        className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
      />

      {/* Escala */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-foreground/80">Níveis da escala <span className="font-normal text-muted-foreground">(do menor para o maior)</span></p>
          {escala.length < 6 && (
            <button type="button" onClick={addNivel} className="inline-flex items-center gap-1 text-xs font-medium text-lumii-coral hover:underline">
              <Plus className="w-3.5 h-3.5" /> Nível
            </button>
          )}
        </div>
        <div className="space-y-1.5">
          {escala.map((nivel, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{i + 1}</span>
              <input
                value={nivel}
                onChange={(e) => setNivel(i, e.target.value)}
                maxLength={40}
                placeholder={`Nível ${i + 1}`}
                className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
              />
              {escala.length > 2 && (
                <button type="button" onClick={() => removeNivel(i)} aria-label={`Remover nível ${i + 1}`} className="p-1.5 rounded text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Critérios */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-foreground/80">Critérios avaliados</p>
          {itens.length < 30 && (
            <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-xs font-medium text-lumii-coral hover:underline">
              <Plus className="w-3.5 h-3.5" /> Critério
            </button>
          )}
        </div>
        <div className="space-y-1.5">
          {itens.map((it) => (
            <div key={it.id} className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
              <input
                value={it.nome}
                onChange={(e) => setItem(it.id, e.target.value)}
                maxLength={120}
                placeholder="ex.: Clareza na explicação"
                className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
              />
              {itens.length > 1 && (
                <button type="button" onClick={() => removeItem(it.id)} aria-label="Remover critério" className="p-1.5 rounded text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} disabled={isPending} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors min-h-[40px] disabled:opacity-50">
          Cancelar
        </button>
        <button type="button" onClick={handleSave} disabled={isPending || !titulo.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-lumii-coral hover:bg-lumii-coral-hover transition-colors min-h-[40px] disabled:opacity-50">
          <Check className="w-4 h-4" />
          {initial ? "Salvar" : "Criar rubrica"}
        </button>
      </div>
    </div>
  );
}
