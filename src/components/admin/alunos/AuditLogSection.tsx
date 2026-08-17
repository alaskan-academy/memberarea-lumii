import { ClipboardList } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";

type AuditEntry = {
  id: string;
  action: string;
  meta: Record<string, unknown>;
  created_at: string;
  admin: { full_name: string | null } | null;
};

const ACTION_LABELS: Record<string, string> = {
  grant_access: "Acesso concedido",
  revoke_access: "Acesso revogado",
  "enrollment.revoked": "Acesso revogado (webhook)",
  ban: "Aluna banida",
  unban: "Ban removido",
  update_email: "E-mail atualizado",
  set_password: "Senha definida pelo admin",
  reject_forum_post: "Post do fórum rejeitado",
  delete_forum_post: "Post do fórum deletado",
};

/**
 * Server Component — busca o próprio histórico de auditoria desta aluna e
 * renderiza a seção completa. Extraído de aluna-detail.tsx pelo mesmo motivo
 * de CertificatesSection.tsx: exibição pura, sem interatividade. Não
 * renderiza nada quando vazio (mesmo comportamento do bloco original).
 */
export default async function AuditLogSection({ userId }: { userId: string }) {
  const service = createServiceClient();
  const { data: auditLogRaw } = await service
    .from("audit_log")
    .select("id, action, target_type, meta, created_at, admin:profiles!admin_id(full_name)")
    .eq("meta->>user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const auditLog = (auditLogRaw ?? []) as unknown as AuditEntry[];

  if (auditLog.length === 0) return null;

  return (
    <section className="lumii-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-sm">Histórico de ações</h2>
      </div>
      <ul className="divide-y divide-border/40">
        {auditLog.map((entry) => (
          <li key={entry.id} className="px-5 py-3 space-y-0.5">
            <p className="text-xs font-medium">
              {ACTION_LABELS[entry.action] ?? entry.action}
            </p>
            {typeof entry.meta?.reason === "string" && (
              <p className="text-xs text-muted-foreground">
                Motivo: {entry.meta.reason}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              {entry.admin?.full_name ?? "Admin"} ·{" "}
              {new Date(entry.created_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Sao_Paulo",
              })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
