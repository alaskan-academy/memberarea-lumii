"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Search, Library } from "lucide-react";
import {
  BIBLIOTECA_TIPOS,
  type BibliotecaTipo,
  type LessonResourceRow,
} from "@/lib/ferramentas/planejamento/types";
import ResourceForm from "./ResourceForm";
import ResourceCard from "./ResourceCard";

type FormState = { mode: "new" } | { mode: "edit"; resource: LessonResourceRow } | null;

export default function BibliotecaClient({
  initialResources,
}: {
  initialResources: LessonResourceRow[];
}) {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<BibliotecaTipo | "todos">("todos");
  const [form, setForm] = useState<FormState>(null);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return initialResources.filter((r) => {
      if (filtroTipo !== "todos" && r.tipo !== filtroTipo) return false;
      if (!q) return true;
      return (
        r.titulo.toLowerCase().includes(q) ||
        r.texto.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [initialResources, busca, filtroTipo]);

  const vazio = initialResources.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href="/ferramentas"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Ferramentas
      </Link>

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Planejamento</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sua biblioteca de planos e atividades — salve uma vez, reuse e adapte ano a ano.
          </p>
        </div>
        {!form && (
          <button
            type="button"
            onClick={() => setForm({ mode: "new" })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[40px] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo material</span>
          </button>
        )}
      </div>

      {form && (
        <div className="mb-6">
          <ResourceForm
            initial={form.mode === "edit" ? form.resource : null}
            onDone={() => setForm(null)}
          />
        </div>
      )}

      {vazio && !form ? (
        <div className="text-center py-12 text-muted-foreground">
          <Library className="w-9 h-9 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground/80">Sua biblioteca está vazia</p>
          <p className="text-xs mt-1 mb-4">
            Guarde aqui seus planos de aula e atividades. No ano que vem, é só reusar.
          </p>
          <button
            type="button"
            onClick={() => setForm({ mode: "new" })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar o primeiro
          </button>
        </div>
      ) : (
        !vazio && (
          <>
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por título, tag ou conteúdo…"
                  className="w-full text-sm border border-border rounded-lg pl-9 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
                />
              </div>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as BibliotecaTipo | "todos")}
                className="text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
              >
                <option value="todos">Todos os tipos</option>
                {BIBLIOTECA_TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {filtrados.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum material encontrado com esse filtro.
              </p>
            ) : (
              <div className="space-y-3">
                {filtrados.map((r) => (
                  <ResourceCard key={r.id} resource={r} onEdit={(res) => setForm({ mode: "edit", resource: res })} />
                ))}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
