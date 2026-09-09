"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X, ImageIcon } from "lucide-react";
import type { PortfolioItem } from "@/lib/ferramentas/portfolio/types";
import { updatePortfolioItem, deletePortfolioItem } from "@/lib/ferramentas/portfolio/actions";
import AutoGrowTextarea from "../support-plan/AutoGrowTextarea";

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PortfolioCard({ item }: { item: PortfolioItem }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [titulo, setTitulo] = useState(item.titulo);
  const [descricao, setDescricao] = useState(item.descricao);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveEdit() {
    if (!titulo.trim()) return setError("Dê um título");
    setError(null);
    startTransition(async () => {
      const res = await updatePortfolioItem({ id: item.id, titulo: titulo.trim(), descricao: descricao.trim() || undefined });
      if (res.error) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function excluir() {
    setError(null);
    startTransition(async () => {
      const res = await deletePortfolioItem(item.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="lumii-card overflow-hidden flex flex-col">
      {item.anexoUrl ? (
        <a href={item.anexoUrl} target="_blank" rel="noopener noreferrer" className="block bg-muted/40" title="Ver em tamanho grande">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.anexoUrl} alt={item.titulo} className="w-full aspect-[4/3] object-cover" loading="lazy" />
        </a>
      ) : (
        <div className="w-full aspect-[4/3] bg-muted/40 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
        </div>
      )}

      <div className="p-3 flex-1 flex flex-col">
        {editing ? (
          <div className="space-y-2">
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={200}
              className="w-full text-sm border border-border rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
            />
            <AutoGrowTextarea value={descricao} onChange={setDescricao} maxLength={2000} maxHeight={140} className="bg-white" />
            {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
            <div className="flex justify-end gap-1.5">
              <button type="button" onClick={() => { setEditing(false); setTitulo(item.titulo); setDescricao(item.descricao); setError(null); }} disabled={isPending} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors disabled:opacity-50">
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
              <button type="button" onClick={saveEdit} disabled={isPending || !titulo.trim()} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors disabled:opacity-50">
                <Check className="w-3.5 h-3.5" /> Salvar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-semibold text-sm text-foreground break-words">{item.titulo}</p>
            {item.descricao && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words flex-1">{item.descricao}</p>}
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
              <span className="text-[11px] text-muted-foreground mr-auto">{formatData(item.created_at)}</span>
              <button type="button" onClick={() => setEditing(true)} aria-label="Editar item" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Excluir item" className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {confirmDelete && (
              <div className="mt-2 flex items-center gap-2 text-xs bg-red-50 text-red-700 rounded-lg px-2.5 py-2">
                <span className="flex-1">Excluir{item.anexoUrl ? " (a foto também)" : ""}?</span>
                <button type="button" onClick={() => setConfirmDelete(false)} disabled={isPending} className="px-2 py-1 rounded hover:bg-red-100 disabled:opacity-50">Não</button>
                <button type="button" onClick={excluir} disabled={isPending} className="px-2 py-1 rounded bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50">Sim</button>
              </div>
            )}
            {error && !confirmDelete && <p role="alert" className="text-xs text-red-500 mt-1">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
