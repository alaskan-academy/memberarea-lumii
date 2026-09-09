"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen } from "lucide-react";
import {
  DIARIO_TIPOS,
  type DiarioTipo,
  type StudentLogRow,
} from "@/lib/ferramentas/diario/types";
import { createLog } from "@/lib/ferramentas/diario/actions";
import AutoGrowTextarea from "../support-plan/AutoGrowTextarea";
import RegistroItem from "./RegistroItem";

// Data local (o fuso do navegador da professora, BRT) em YYYY-MM-DD — montada a
// partir das partes locais para não pegar o "ontem" do UTC.
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function DiarioPanel({
  studentId,
  studentName,
  initialLogs,
}: {
  studentId: string;
  studentName: string;
  initialLogs: StudentLogRow[];
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<DiarioTipo>("registro");
  const [texto, setTexto] = useState("");
  const [data, setData] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hoje = todayISO();

  function handleAdd() {
    if (!texto.trim()) {
      setError("Escreva o registro");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createLog({ student_id: studentId, tipo, texto: texto.trim(), data });
      if (res.error) {
        setError(res.error);
        return;
      }
      // Mantém tipo e data (facilita registrar vários do mesmo dia), limpa o texto.
      setTexto("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Novo registro */}
      <div className="lumii-card p-4 sm:p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">Novo registro</p>

        <div className="flex flex-wrap gap-1.5">
          {DIARIO_TIPOS.map((t) => {
            const active = tipo === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipo(t.value)}
                title={t.desc}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all min-h-[36px] ${
                  active
                    ? `${t.chip} ring-2 ring-offset-1 ring-current`
                    : "bg-muted/60 text-foreground/60 hover:bg-muted"
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
          placeholder={`O que você quer registrar sobre ${studentName.split(" ")[0]}?`}
          maxLength={2000}
          maxHeight={280}
          className="bg-white"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Data
            <input
              type="date"
              value={data}
              max={hoje}
              onChange={(e) => setData(e.target.value)}
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
            />
          </label>

          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending || !texto.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[40px] disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-500">
            {error}
          </p>
        )}
      </div>

      {/* Timeline */}
      {initialLogs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum registro ainda.</p>
          <p className="text-xs mt-1">
            Anote conquistas, pontos de atenção e conversas — vira histórico do ano.
          </p>
        </div>
      ) : (
        <ol className="space-y-2.5">
          {initialLogs.map((log) => (
            <RegistroItem key={log.id} log={log} />
          ))}
        </ol>
      )}
    </div>
  );
}
