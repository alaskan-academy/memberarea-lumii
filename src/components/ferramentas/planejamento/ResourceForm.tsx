"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";
import {
  BIBLIOTECA_TIPOS,
  type BibliotecaTipo,
  type LessonResourceRow,
} from "@/lib/ferramentas/planejamento/types";
import { createResource, updateResource } from "@/lib/ferramentas/planejamento/actions";
import AutoGrowTextarea from "../support-plan/AutoGrowTextarea";

export default function ResourceForm({
  initial,
  onDone,
}: {
  initial: LessonResourceRow | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [tipo, setTipo] = useState<BibliotecaTipo>(initial?.tipo ?? "plano");
  const [texto, setTexto] = useState(initial?.texto ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addTag() {
    const t = tagInput.trim().slice(0, 40);
    if (!t) return;
    setTags((prev) => (prev.some((x) => x.toLowerCase() === t.toLowerCase()) ? prev : [...prev, t]));
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  function handleSave() {
    if (!titulo.trim()) {
      setError("Dê um título");
      return;
    }
    setError(null);
    startTransition(async () => {
      const payload = { titulo: titulo.trim(), tipo, texto, tags };
      const res = initial
        ? await updateResource({ id: initial.id, ...payload })
        : await createResource(payload);
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
        <p className="text-sm font-semibold text-foreground">
          {initial ? "Editar material" : "Novo material"}
        </p>
        <button
          type="button"
          onClick={onDone}
          aria-label="Fechar"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título — ex.: Plano de aula: frações (5º ano)"
        maxLength={200}
        className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
      />

      <div className="flex flex-wrap gap-1.5">
        {BIBLIOTECA_TIPOS.map((t) => {
          const active = tipo === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipo(t.value)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all min-h-[34px] ${
                active ? `${t.chip} ring-2 ring-offset-1 ring-current` : "bg-muted/60 text-foreground/60 hover:bg-muted"
              }`}
            >
              <span aria-hidden>{t.emoji}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      <AutoGrowTextarea
        value={texto}
        onChange={setTexto}
        placeholder="Objetivos, desenvolvimento, materiais, observações… escreva como preferir."
        maxLength={20000}
        maxHeight={420}
        className="bg-white"
      />

      {/* Tags */}
      <div>
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-foreground/70">
              {t}
              <button type="button" onClick={() => removeTag(t)} aria-label={`Remover ${t}`} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder="Tags (ano, disciplina, tema) — Enter para adicionar"
          className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors min-h-[40px] disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !titulo.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-lumii-coral hover:bg-lumii-coral-hover transition-colors min-h-[40px] disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {initial ? "Salvar" : "Adicionar à biblioteca"}
        </button>
      </div>
    </div>
  );
}
