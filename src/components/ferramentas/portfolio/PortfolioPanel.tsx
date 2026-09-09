"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ImagePlus, X, FolderOpen, Loader2 } from "lucide-react";
import type { PortfolioItem } from "@/lib/ferramentas/portfolio/types";
import { createPortfolioItem } from "@/lib/ferramentas/portfolio/actions";
import AutoGrowTextarea from "../support-plan/AutoGrowTextarea";
import PortfolioCard from "./PortfolioCard";

// Comprime a imagem no navegador (máx 1600px, WebP q0.82) para caber no limite de
// corpo da requisição e reduzir o peso — e de quebra remove metadados (EXIF/GPS).
// GIF passa direto para não perder a animação (o servidor converte pra WebP animado).
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const max = 1600;
    let { width, height } = bitmap;
    if (width > max || height > max) {
      const scale = Math.min(max / width, max / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.82));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

export default function PortfolioPanel({
  studentId,
  studentName,
  initialItems,
}: {
  studentId: string;
  studentName: string;
  initialItems: PortfolioItem[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // permite re-selecionar o mesmo arquivo
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Escolha uma imagem");
      return;
    }
    setError(null);
    setCompressing(true);
    const compressed = await compressImage(f);
    setCompressing(false);
    setFile(compressed);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(compressed);
    });
  }

  function removerFoto() {
    setFile(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }

  function resetForm() {
    setTitulo("");
    setDescricao("");
    removerFoto();
    setError(null);
    setOpen(false);
  }

  function handleSave() {
    if (!titulo.trim()) {
      setError("Dê um título");
      return;
    }
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("student_id", studentId);
      fd.append("titulo", titulo.trim());
      if (descricao.trim()) fd.append("descricao", descricao.trim());
      if (file) fd.append("foto", file);
      const res = await createPortfolioItem(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      resetForm();
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Guarde os trabalhos de {studentName.split(" ")[0]} — desenhos, projetos, conquistas.
        </p>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[40px] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo item</span>
          </button>
        )}
      </div>

      {open && (
        <div className="lumii-card p-4 sm:p-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">Novo item do portfólio</p>

          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título — ex.: Desenho da família"
            maxLength={200}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
          />

          <AutoGrowTextarea
            value={descricao}
            onChange={setDescricao}
            placeholder="Uma descrição (opcional)…"
            maxLength={2000}
            maxHeight={200}
            className="bg-white"
          />

          {/* Foto */}
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} hidden />
          {preview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Prévia" className="max-h-48 rounded-lg border border-border" />
              <button
                type="button"
                onClick={removerFoto}
                aria-label="Remover foto"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-border shadow flex items-center justify-center text-muted-foreground hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={compressing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-border text-muted-foreground hover:border-lumii-coral hover:text-lumii-coral transition-colors disabled:opacity-50"
            >
              {compressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              {compressing ? "Preparando…" : "Adicionar foto"}
            </button>
          )}

          {error && <p role="alert" className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} disabled={isPending} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors min-h-[40px] disabled:opacity-50">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={isPending || compressing || !titulo.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[40px] disabled:opacity-50">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isPending ? "Salvando…" : "Adicionar"}
            </button>
          </div>
        </div>
      )}

      {initialItems.length === 0 && !open ? (
        <div className="text-center py-10 text-muted-foreground">
          <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Portfólio vazio.</p>
          <p className="text-xs mt-1">Adicione fotos de trabalhos e conquistas ao longo do ano.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {initialItems.map((item) => (
            <PortfolioCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
