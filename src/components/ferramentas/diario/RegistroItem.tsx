"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X } from "lucide-react";
import {
  DIARIO_TIPOS,
  DIARIO_TIPO_MAP,
  type DiarioTipo,
  type StudentLogRow,
} from "@/lib/ferramentas/diario/types";
import { updateLog, deleteLog } from "@/lib/ferramentas/diario/actions";
import AutoGrowTextarea from "../support-plan/AutoGrowTextarea";

// Data-do-fato "YYYY-MM-DD" → rótulo pt-BR. Constrói ao meio-dia local pra não
// escorregar um dia por causa do UTC.
function formatData(s: string): string {
  const d = new Date(`${s}T12:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function RegistroItem({ log }: { log: StudentLogRow }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tipo, setTipo] = useState<DiarioTipo>(log.tipo);
  const [texto, setTexto] = useState(log.texto);
  const [data, setData] = useState(log.data);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const meta = DIARIO_TIPO_MAP[log.tipo] ?? DIARIO_TIPO_MAP.registro;
  const hoje = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(
    new Date().getDate()
  ).padStart(2, "0")}`;

  function handleSave() {
    if (!texto.trim()) {
      setError("Escreva o registro");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateLog({ log_id: log.id, tipo, texto: texto.trim(), data });
      if (res.error) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteLog(log.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function cancelEdit() {
    setTipo(log.tipo);
    setTexto(log.texto);
    setData(log.data);
    setError(null);
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="lumii-card p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {DIARIO_TIPOS.map((t) => {
            const active = tipo === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipo(t.value)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all min-h-[36px] ${
                  active ? `${t.chip} ring-2 ring-offset-1 ring-current` : "bg-muted/60 text-foreground/60 hover:bg-muted"
                }`}
              >
                <span aria-hidden>{t.emoji}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        <AutoGrowTextarea value={texto} onChange={setTexto} maxLength={2000} maxHeight={280} className="bg-white" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <input
            type="date"
            value={data}
            max={hoje}
            onChange={(e) => setData(e.target.value)}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isPending}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors min-h-[40px] disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !texto.trim()}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[40px] disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-xs text-red-500">
            {error}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className="lumii-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.chip}`}>
            <span aria-hidden>{meta.emoji}</span>
            {meta.label}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">{formatData(log.data)}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar registro"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Excluir registro"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap break-words">{log.texto}</p>

      {confirmDelete && (
        <div className="mt-3 flex items-center gap-2 text-xs bg-red-50 text-red-700 rounded-lg px-3 py-2">
          <span className="flex-1">Excluir este registro? Não dá para desfazer.</span>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            disabled={isPending}
            className="px-2 py-1 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-2 py-1 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            Excluir
          </button>
        </div>
      )}
      {error && !confirmDelete && (
        <p role="alert" className="text-xs text-red-500 mt-2">
          {error}
        </p>
      )}
    </li>
  );
}
