"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/supabase/admin-guard";
import { createServiceClient } from "@/lib/supabase/service";

// Concede/revoga o Lumii Completo manualmente (cortesia, bônus, correção).
// Access é derivado da membership (is_enrolled), mas matriculamos nos cursos
// in_plan com source='subscription' e o CARIMBO granted_at da membership, para
// (a) progresso/certificado funcionarem já e (b) na revogação expirar SÓ o que
// veio com o plano — curso comprado avulso (outro carimbo) fica intocado.

// O <input type="date"> envia 'YYYY-MM-DD'. Gravar direto num timestamptz vira
// meia-noite UTC = 21h do dia anterior no fuso de Brasília (UTC-3, sem horário de
// verão) — venceria e exibiria um dia antes. Normaliza para o fim do dia BRT.
function toExpiryTimestamp(dateStr: string | undefined): string | null {
  const s = (dateStr ?? "").trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T23:59:59-03:00`;
  return s;
}

const GrantSchema = z.object({
  userId: z.string().uuid(),
  source: z.enum(["manual", "bonus"]).default("manual"),
  reason: z.string().trim().min(1, "Informe o motivo").max(500),
  // data opcional (YYYY-MM-DD) do input; vazio = sem prazo
  expiresAt: z.string().trim().optional(),
});

type Result = { error?: string; ok?: string };

export async function grantMembershipAction(input: {
  userId: string;
  source?: string;
  reason: string;
  expiresAt?: string;
}): Promise<Result> {
  let adminId: string;
  try {
    ({ adminId } = await assertAdmin());
  } catch {
    return { error: "Não autorizado" };
  }

  const parsed = GrantSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { userId, source, reason } = parsed.data;
  const expiresAt = toExpiryTimestamp(parsed.data.expiresAt);

  const service = createServiceClient();

  // 1. Já tem ativa? recusa. Vencida-não-revogada? fecha antes de abrir a nova.
  const { data: existing } = await service
    .from("memberships")
    .select("id, expires_at")
    .eq("user_id", userId)
    .eq("plan", "completo")
    .is("revoked_at", null)
    .maybeSingle();

  if (existing) {
    const stillActive = !existing.expires_at || new Date(existing.expires_at) > new Date();
    if (stillActive) return { error: "Esta aluna já tem o Lumii Completo ativo." };
    await service.from("memberships").update({ revoked_at: new Date().toISOString() }).eq("id", existing.id);
  }

  // 2. Insere a membership (o carimbo granted_at é a referência das matrículas do plano)
  const grantedAt = new Date().toISOString();
  const { data: membership, error: memErr } = await service
    .from("memberships")
    .insert({
      user_id: userId,
      plan: "completo",
      source,
      granted_at: grantedAt,
      expires_at: expiresAt,
      granted_by: adminId,
      reason,
    })
    .select("id")
    .single();
  if (memErr || !membership) {
    // Corrida de dupla concessão: o índice único memberships_one_active barra a
    // segunda inserção — devolve a recusa amigável em vez do erro cru do banco.
    const dup =
      (memErr as { code?: string } | null)?.code === "23505" ||
      /duplicate|one_active/i.test(memErr?.message ?? "");
    return { error: dup ? "Esta aluna já tem o Lumii Completo ativo." : "Erro ao conceder: " + (memErr?.message ?? "desconhecido") };
  }

  // 3. Matricula em todos os cursos in_plan (com o carimbo). Curso avulso já
  //    ativo não é tocado; matrícula vencida ou de plano anterior é reescrita.
  const { data: planCourses } = await service.from("courses").select("id").eq("in_plan", true);
  let granted = 0;
  let skipped = 0;
  for (const c of planCourses ?? []) {
    const { data: enr } = await service
      .from("enrollments")
      .select("source")
      .eq("user_id", userId)
      .eq("course_id", c.id)
      .maybeSingle();

    // Qualquer matrícula avulsa (payt/manual), ativa OU vencida, é preservada —
    // não sobrescreve a origem da compra. O acesso ao curso do plano vem da
    // membership (is_enrolled 2º ramo), não desta linha.
    if (enr && enr.source !== "subscription") {
      skipped++;
      continue;
    }
    // sem matrícula, ou já era 'subscription' (plano anterior): (re)cria com o carimbo
    await service.from("enrollments").upsert(
      { user_id: userId, course_id: c.id, source: "subscription", granted_at: grantedAt, expires_at: expiresAt },
      { onConflict: "user_id,course_id" }
    );
    granted++;
  }

  // 4. Auditoria
  await service.from("audit_log").insert({
    admin_id: adminId,
    action: "membership.granted",
    target_type: "membership",
    target_id: membership.id,
    meta: { user_id: userId, source, reason, expires_at: expiresAt, courses_granted: granted, courses_skipped: skipped },
  });

  revalidatePath(`/admin/alunos/${userId}`);
  return { ok: `Lumii Completo concedido — ${granted} curso(s) liberado(s)${skipped ? `, ${skipped} já tinha(m) avulso` : ""}.` };
}

export async function revokeMembershipAction(input: { userId: string; reason?: string }): Promise<Result> {
  let adminId: string;
  try {
    ({ adminId } = await assertAdmin());
  } catch {
    return { error: "Não autorizado" };
  }

  const userId = String(input.userId ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { error: "Aluna inválida" };
  const reason = String(input.reason ?? "").trim() || null;

  const service = createServiceClient();

  const { data: membership } = await service
    .from("memberships")
    .select("id, granted_at")
    .eq("user_id", userId)
    .eq("plan", "completo")
    .is("revoked_at", null)
    .maybeSingle();
  if (!membership) return { error: "Esta aluna não tem o Lumii Completo ativo." };

  const now = new Date().toISOString();
  await service.from("memberships").update({ revoked_at: now }).eq("id", membership.id);

  // Expira SÓ as matrículas com o carimbo desta membership (não toca avulso)
  const { data: revoked } = await service
    .from("enrollments")
    .update({ expires_at: now })
    .eq("user_id", userId)
    .eq("source", "subscription")
    .eq("granted_at", membership.granted_at)
    .select("id");

  await service.from("audit_log").insert({
    admin_id: adminId,
    action: "membership.revoked",
    target_type: "membership",
    target_id: membership.id,
    meta: { user_id: userId, reason, enrollments_expired: revoked?.length ?? 0 },
  });

  revalidatePath(`/admin/alunos/${userId}`);
  return { ok: `Lumii Completo revogado — ${revoked?.length ?? 0} matrícula(s) do plano encerrada(s).` };
}
