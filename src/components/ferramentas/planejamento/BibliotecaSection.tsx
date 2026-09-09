"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Library } from "lucide-react";
import {
  BIBLIOTECA_TIPOS,
  type BibliotecaTipo,
  type LessonResourceRow,
} from "@/lib/ferramentas/planejamento/types";
import ResourceForm from "./ResourceForm";
import ResourceCard from "./ResourceCard";

type FormState = { mode: "new" } | { mode: "edit"; resource: LessonResourceRow } | null;

export default function BibliotecaSection({
  resources,
}: {
  resources: LessonResourceRow[];
}) {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<BibliotecaTipo | "todos">("todos");
  const [form, setForm] = useState<FormState>(null);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return resources.filter((r) => {
      if (filtroTipo !== "todos" && r.tipo !== filtroTipo) return false;
      if (!q) return true;
      return (
        r.titulo.toLowerCase().includes(q) ||
        r.texto.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [resources, busca, filtroTipo]);

  const vazio = resources.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Salve uma vez, reuse e adapte ano a ano.
        </p>
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
        <ResourceForm
          initial={form.mode === "edit" ? form.resource : null}
          onDone={() => setForm(null)}
        />
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
            <div className="flex flex-col sm:flex-row gap-2">
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
