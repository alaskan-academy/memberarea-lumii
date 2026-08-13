"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalBackGuard } from "@/hooks/useModalBackGuard";
import { createCheckin } from "@/lib/ferramentas/support-plan/actions";
import AutoGrowTextarea from "./AutoGrowTextarea";

type CheckinStatus = "melhorou" | "igual" | "piorou";

const OPTIONS: { value: CheckinStatus; label: string; emoji: string; color: string }[] = [
  { value: "melhorou", label: "Melhorou", emoji: "🟢", color: "#71c69a" },
  { value: "igual", label: "Igual", emoji: "🟡", color: "#eebc3e" },
  { value: "piorou", label: "Piorou", emoji: "🔴", color: "#f6614f" },
];

export default function CheckinModal({
  open,
  onClose,
  supportPlanId,
}: {
  open: boolean;
  onClose: () => void;
  supportPlanId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  useModalBackGuard(open, onClose);

  if (!open) return null;

  function handleSave() {
    if (!status) return;
    setError(null);
    startTransition(async () => {
      const res = await createCheckin({ support_plan_id: supportPlanId, status, notes: notes || undefined });
      if (res.error) {
        setError(res.error);
        return;
      }
      setStatus(null);
      setNotes("");
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Fazer check-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Como está agora?</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setStatus(o.value)}
              className={cn(
                "flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-colors",
                status === o.value ? "border-current" : "border-border"
              )}
              style={status === o.value ? { color: o.color, backgroundColor: `${o.color}15` } : undefined}
            >
              <span className="text-2xl" aria-hidden>
                {o.emoji}
              </span>
              <span className="text-xs font-semibold">{o.label}</span>
            </button>
          ))}
        </div>

        <AutoGrowTextarea
          value={notes}
          onChange={setNotes}
          placeholder="Nota opcional..."
          className="mb-4"
        />

        {error && <p role="alert" className="text-xs text-red-500 mb-3">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={!status || isPending}
          className="w-full py-2.5 rounded-lg font-semibold text-white bg-[#f6614f] hover:bg-[#e2543f] disabled:opacity-50 transition-colors min-h-[44px]"
        >
          {isPending ? "Salvando..." : "Salvar check-in"}
        </button>
      </div>
    </div>
  );
}
