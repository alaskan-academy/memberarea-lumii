"use client";

import { useState, useTransition } from "react";
import { Crown, Loader2, ShieldOff } from "lucide-react";
import {
  grantMembershipAction,
  revokeMembershipAction,
} from "@/app/(admin)/admin/alunos/[userId]/membership-actions";

export type MembershipInfo = {
  source: string;
  granted_at: string;
  expires_at: string | null;
} | null;

function fmt(d: string | null): string {
  if (!d) return "sem prazo";
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

const SOURCE_LABEL: Record<string, string> = {
  payt: "Assinatura (Payt)",
  manual: "Manual",
  bonus: "Bônus",
  migration: "Migração",
};

export default function MembershipPanel({
  userId,
  membership,
}: {
  userId: string;
  membership: MembershipInfo;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [source, setSource] = useState<"manual" | "bonus">("manual");
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const active = !!membership;

  function grant() {
    setMsg(null);
    startTransition(async () => {
      const r = await grantMembershipAction({ userId, source, reason, expiresAt });
      setMsg(r);
      if (r.ok) setReason("");
    });
  }

  function revoke() {
    setMsg(null);
    startTransition(async () => {
      const r = await revokeMembershipAction({ userId, reason });
      setMsg(r);
      if (r.ok) {
        setReason("");
        setConfirmRevoke(false);
      }
    });
  }

  return (
    <div className="lumii-card p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-lumii-yellow/15 flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5 text-lumii-yellow" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-foreground">Lumii Completo</h3>
          <p className="text-xs text-muted-foreground">Assinatura anual / acesso ao plano</p>
        </div>
      </div>

      {active ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-lumii-green bg-lumii-green/10 px-2 py-0.5 rounded-full">
              Ativo
            </span>
            <span className="text-xs text-muted-foreground">
              {SOURCE_LABEL[membership!.source] ?? membership!.source}
            </span>
          </div>
          <dl className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <dt>Concedido em</dt>
              <dd className="text-foreground font-medium">{fmt(membership!.granted_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Vence em</dt>
              <dd className="text-foreground font-medium">{fmt(membership!.expires_at)}</dd>
            </div>
          </dl>

          {!confirmRevoke ? (
            <button
              onClick={() => { setConfirmRevoke(true); setMsg(null); }}
              className="w-full inline-flex items-center justify-center gap-1.5 min-h-[40px] rounded-lg border border-lumii-coral/40 text-lumii-coral text-sm font-semibold hover:bg-lumii-coral/5 transition-colors"
            >
              <ShieldOff className="w-4 h-4" /> Revogar acesso
            </button>
          ) : (
            <div className="space-y-2 rounded-lg border border-lumii-coral/30 bg-lumii-coral/5 p-3">
              <p className="text-xs text-foreground font-medium">Revogar o Lumii Completo desta aluna?</p>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo (opcional)"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lumii-coral/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={revoke}
                  disabled={pending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] rounded-lg bg-lumii-coral text-white text-sm font-semibold hover:bg-lumii-coral-hover disabled:opacity-60 transition-colors"
                >
                  {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar
                </button>
                <button
                  onClick={() => { setConfirmRevoke(false); setReason(""); }}
                  disabled={pending}
                  className="px-4 min-h-[40px] rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs text-muted-foreground">
            Esta aluna <strong className="text-foreground">não</strong> tem o plano. Conceda manualmente (cortesia, bônus, correção):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as "manual" | "bonus")}
              className="rounded-lg border border-border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lumii-coral/30"
            >
              <option value="manual">Manual</option>
              <option value="bonus">Bônus</option>
            </select>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              title="Vencimento (opcional)"
              className="rounded-lg border border-border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lumii-coral/30"
            />
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (obrigatório)"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lumii-coral/30"
          />
          <button
            onClick={grant}
            disabled={pending || !reason.trim()}
            className="w-full inline-flex items-center justify-center gap-1.5 min-h-[40px] rounded-lg bg-lumii-coral text-white text-sm font-semibold hover:bg-lumii-coral-hover disabled:opacity-60 transition-colors"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            Conceder Lumii Completo
          </button>
          <p className="text-[10px] text-muted-foreground">
            Libera todos os cursos marcados “Incluído no Lumii Completo”. Deixe o vencimento vazio para acesso sem prazo.
          </p>
        </div>
      )}

      {msg?.ok && <p className="text-xs text-lumii-green bg-lumii-green/10 px-3 py-2 rounded-lg">{msg.ok}</p>}
      {msg?.error && <p role="alert" className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{msg.error}</p>}
    </div>
  );
}
