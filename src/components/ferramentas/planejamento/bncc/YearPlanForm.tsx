"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";
import { BIMESTRES, BNCC_COMPONENTES, type YearPlanRow } from "@/lib/ferramentas/planejamento/bncc/types";
import { createYearPlan, updateYearPlan } from "@/lib/ferramentas/planejamento/bncc/actions";
import AutoGrowTextarea from "../../support-plan/AutoGrowTextarea";

export default function YearPlanForm({
  initial,
  onDone,
}: {
  initial: YearPlanRow | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [ano, setAno] = useState(initial?.ano ?? new Date().getFullYear());
  const [bimestre, setBimestre] = useState(initial?.bimestre ?? 0);
  const [componente, setComponente] = useState(initial?.componente ?? "");
  const [codes, setCodes] = useState<string[]>(initial?.bncc_codes ?? []);
  const [codeInput, setCodeInput] = useState("");
  const [texto, setTexto] = useState(initial?.texto ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addCode() {
    const c = codeInput.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
    if (!c) return;
    setCodes((prev) => (prev.includes(c) ? prev : [...prev, c]));
    setCodeInput("");
  }
  function removeCode(c: string) {
    setCodes((prev) => prev.filter((x) => x !== c));
  }

  function handleSave() {
    if (!titulo.trim()) return setError("Dê um título");
    setError(null);
    const payload = {
      titulo: titulo.trim(),
      ano: Number(ano) || new Date().getFullYear(),
      bimestre: Number(bimestre),
      componente: componente.trim() || undefined,
      bncc_codes: codes,
      texto,
    };
    startTransition(async () => {
      const res = initial ? await updateYearPlan({ id: initial.id, ...payload }) : await createYearPlan(payload);
      if (res.error) {
        setError(res.error);
        return;
      }
      onDone();
      router.refresh();
    });
  }

  return (
    <div className="lumii-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{initial ? "Editar planejamento" : "Novo planejamento"}</p>
        <button type="button" onClick={onDone} aria-label="Fechar" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título — ex.: Números e operações"
        maxLength={200}
        className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <label className="text-xs text-muted-foreground">
          Ano letivo
          <input
            type="number"
            min={2000}
            max={2100}
            value={ano}
            onChange={(e) => setAno(Number(e.target.value) || new Date().getFullYear())}
            className="mt-1 w-full text-sm border border-border rounded-lg px-2 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Período
          <select
            value={bimestre}
            onChange={(e) => setBimestre(Number(e.target.value))}
            className="mt-1 w-full text-sm border border-border rounded-lg px-2 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
          >
            {BIMESTRES.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted-foreground col-span-2 sm:col-span-1">
          Componente
          <select
            value={componente}
            onChange={(e) => setComponente(e.target.value)}
            className="mt-1 w-full text-sm border border-border rounded-lg px-2 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
          >
            <option value="">—</option>
            {BNCC_COMPONENTES.map((c) => (
              <option key={c.code} value={c.label}>{c.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Códigos BNCC */}
      <div>
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          {codes.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/12 text-primary">
              {c}
              <button type="button" onClick={() => removeCode(c)} aria-label={`Remover ${c}`} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addCode();
            }
          }}
          onBlur={addCode}
          placeholder="Códigos BNCC — ex.: EF03MA05 (Enter para adicionar)"
          className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Componentes: {BNCC_COMPONENTES.map((c) => `${c.code}=${c.label}`).join(" · ")}
        </p>
      </div>

      <AutoGrowTextarea
        value={texto}
        onChange={setTexto}
        placeholder="Objetivos, conteúdos, estratégias… escreva o plano como preferir."
        maxLength={20000}
        maxHeight={360}
        className="bg-white"
      />

      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} disabled={isPending} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors min-h-[40px] disabled:opacity-50">
          Cancelar
        </button>
        <button type="button" onClick={handleSave} disabled={isPending || !titulo.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-lumii-coral hover:bg-lumii-coral-hover transition-colors min-h-[40px] disabled:opacity-50">
          <Check className="w-4 h-4" />
          {initial ? "Salvar" : "Criar planejamento"}
        </button>
      </div>
    </div>
  );
}
