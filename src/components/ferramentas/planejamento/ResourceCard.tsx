"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Copy, Files, Trash2, ChevronDown, ChevronUp, Check } from "lucide-react";
import { BIBLIOTECA_TIPO_MAP, type LessonResourceRow } from "@/lib/ferramentas/planejamento/types";
import { deleteResource, duplicateResource } from "@/lib/ferramentas/planejamento/actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ResourceCard({
  resource,
  onEdit,
}: {
  resource: LessonResourceRow;
  onEdit: (r: LessonResourceRow) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const meta = BIBLIOTECA_TIPO_MAP[resource.tipo] ?? BIBLIOTECA_TIPO_MAP.outro;
  const temTexto = resource.texto.trim().length > 0;
  const longo = resource.texto.length > 220;

  function copiar() {
    const conteudo = `${resource.titulo}\n\n${resource.texto}`.trim();
    navigator.clipboard
      .writeText(conteudo)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  }

  function duplicar() {
    setError(null);
    startTransition(async () => {
      const res = await duplicateResource(resource.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function excluir() {
    setError(null);
    startTransition(async () => {
      const res = await deleteResource(resource.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="lumii-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.chip}`}>
              <span aria-hidden>{meta.emoji}</span>
              {meta.label}
            </span>
            <span className="text-xs text-muted-foreground">{formatDate(resource.created_at)}</span>
          </div>
          <h3 className="font-semibold text-foreground mt-1.5 break-words">{resource.titulo}</h3>
        </div>
      </div>

      {resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {resource.tags.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full text-[11px] bg-muted/70 text-foreground/60">
              #{t}
            </span>
          ))}
        </div>
      )}

      {temTexto && (
        <div className="mt-2.5">
          <p className={`text-sm text-foreground/85 whitespace-pre-wrap break-words ${expanded || !longo ? "" : "line-clamp-3"}`}>
            {resource.texto}
          </p>
          {longo && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-lumii-coral hover:underline mt-1"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Recolher" : "Ver tudo"}
            </button>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
        <button
          type="button"
          onClick={() => onEdit(resource)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </button>
        <button
          type="button"
          onClick={duplicar}
          disabled={isPending}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Files className="w-3.5 h-3.5" />
          Duplicar
        </button>
        {temTexto && (
          <button
            type="button"
            onClick={copiar}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          aria-label="Excluir material"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {confirmDelete && (
        <div className="mt-2 flex items-center gap-2 text-xs bg-red-50 text-red-700 rounded-lg px-3 py-2">
          <span className="flex-1">Excluir este material? Não dá para desfazer.</span>
          <button type="button" onClick={() => setConfirmDelete(false)} disabled={isPending} className="px-2 py-1 rounded hover:bg-red-100 disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={excluir} disabled={isPending} className="px-2 py-1 rounded bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50">
            Excluir
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-500 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
