import { createServiceClient } from "@/lib/supabase/service";
import MembershipPanel, { type MembershipInfo } from "./MembershipPanel";

// Busca a membership ativa da aluna e entrega ao painel (client). Vencida conta
// como "sem plano ativo" — mesma regra de has_active_membership() no banco.
export default async function MembershipSection({ userId }: { userId: string }) {
  const service = createServiceClient();
  const { data } = await service
    .from("memberships")
    .select("source, granted_at, expires_at")
    .eq("user_id", userId)
    .eq("plan", "completo")
    .is("revoked_at", null)
    .maybeSingle();

  const active: MembershipInfo =
    data && (!data.expires_at || new Date(data.expires_at) > new Date())
      ? { source: data.source, granted_at: data.granted_at, expires_at: data.expires_at }
      : null;

  return <MembershipPanel userId={userId} membership={active} />;
}
