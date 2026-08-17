"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { assertAdmin } from "@/lib/supabase/admin-guard";
import { revalidatePath } from "next/cache";
import { sendAccessConfirmedEmail } from "@/lib/email";

// Trigger do banco cria a linha em `profiles` de forma assíncrona logo após
// auth.admin.createUser — não é garantido que já exista no instante seguinte.
// Em vez de um setTimeout fixo (podia falhar sob carga, ou desperdiçar tempo
// à toa), tenta a atualização com backoff curto e desiste após algumas tentativas.
async function updateProfileWithRetry(
  service: ReturnType<typeof createServiceClient>,
  userId: string,
  extras: Record<string, unknown>
): Promise<boolean> {
  const delays = [200, 400, 800];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const { data: existing } = await service
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await service.from("profiles").update(extras).eq("id", userId);
      if (error) {
        console.error("[createAccountAndSetPassword] erro ao atualizar profile:", error.message);
        return false;
      }
      return true;
    }

    if (attempt < delays.length) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
  }
  console.error(`[createAccountAndSetPassword] profile de ${userId} não apareceu após retries — trigger pode ter falhado`);
  return false;
}

export async function resendActivationAction(
  email: string
): Promise<{ error?: string; sent?: number }> {
  let adminId: string;
  let adminName: string | null = null;
  try {
    const admin = await assertAdmin();
    adminId = admin.adminId;
    const { data: me } = await admin.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", adminId)
      .single();
    adminName = me?.full_name ?? null;
  } catch (e) {
    return { error: (e as Error).message };
  }

  const service = createServiceClient();
  const normalizedEmail = email.toLowerCase().trim();

  // Garante que não existe conta com este e-mail
  const { data: existingProfile } = await service
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (existingProfile) return { error: "Esta aluna já possui uma conta." };

  // Busca tokens não-utilizados com título do curso
  const { data: tokens } = await service
    .from("activation_tokens")
    .select("id, token, expires_at, buyer_name, courses(id, title, slug)")
    .eq("email", normalizedEmail)
    .eq("used", false)
    .order("created_at", { ascending: false });

  if (!tokens || tokens.length === 0) {
    return { error: "Nenhum token de ativação pendente encontrado." };
  }

  // Renova tokens expirados
  const now = new Date();
  const newExpiry = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const expiredIds = tokens
    .filter((t) => new Date(t.expires_at) < now)
    .map((t) => t.id);
  if (expiredIds.length > 0) {
    await service
      .from("activation_tokens")
      .update({ expires_at: newExpiry })
      .in("id", expiredIds);
  }

  const buyerName =
    (tokens[0] as { buyer_name?: string | null }).buyer_name || normalizedEmail;

  let sent = 0;
  for (const t of tokens) {
    const course = (
      t as unknown as { courses?: { id: string; title: string; slug: string } | null }
    ).courses;
    if (!course) continue;
    const emailResult = await sendAccessConfirmedEmail({
      to: normalizedEmail,
      studentName: buyerName,
      courseTitle: course.title,
      courseSlug: course.slug,
      activationToken: t.token,
    });
    if (!emailResult.success) {
      console.error("[resend-activation] email error:", emailResult.error);
      continue;
    }
    sent++;
  }

  await service.from("audit_log").insert({
    admin_id: adminId,
    action: "resend_activation",
    target_type: "activation_token",
    target_id: null,
    meta: {
      email: normalizedEmail,
      emails_sent: sent,
      admin_name: adminName,
    },
  });

  return { sent };
}

export async function correctEmailAction(
  oldEmail: string,
  newEmail: string
): Promise<{ error?: string; sent?: number }> {
  let adminId: string;
  let adminName: string | null = null;
  try {
    const admin = await assertAdmin();
    adminId = admin.adminId;
    const { data: me } = await admin.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", adminId)
      .single();
    adminName = me?.full_name ?? null;
  } catch (e) {
    return { error: (e as Error).message };
  }

  const service = createServiceClient();
  const normalizedOld = oldEmail.toLowerCase().trim();
  const normalizedNew = newEmail.toLowerCase().trim();

  if (normalizedOld === normalizedNew)
    return { error: "O novo e-mail é igual ao atual." };

  // Novo e-mail não pode já ter conta — comparação exata: ilike trataria "_" e
  // "%" no local-part do e-mail como coringas, podendo casar com a conta errada.
  const { data: existingProfile } = await service
    .from("profiles")
    .select("id")
    .eq("email", normalizedNew)
    .maybeSingle();
  if (existingProfile)
    return { error: "Já existe uma conta com este e-mail." };

  // Busca tokens pendentes do e-mail antigo
  const { data: tokens } = await service
    .from("activation_tokens")
    .select("id, token, expires_at, buyer_name, courses(id, title, slug)")
    .eq("email", normalizedOld)
    .eq("used", false);

  if (!tokens || tokens.length === 0)
    return { error: "Nenhum token pendente encontrado para este e-mail." };

  // Renova tokens expirados e atualiza e-mail
  const now = new Date();
  const newExpiry = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const ids = tokens.map((t) => t.id);

  await service
    .from("activation_tokens")
    .update({
      email: normalizedNew,
      expires_at: newExpiry,
    })
    .in("id", ids);

  // Atualiza payment_events para manter dados limpos
  await service
    .from("payment_events")
    .update({ buyer_email: normalizedNew })
    .eq("buyer_email", normalizedOld);

  // Reenvia e-mails para o endereço correto
  const buyerName =
    (tokens[0] as { buyer_name?: string | null }).buyer_name || normalizedNew;

  let sent = 0;
  for (const t of tokens) {
    const course = (
      t as unknown as { courses?: { id: string; title: string; slug: string } | null }
    ).courses;
    if (!course) continue;
    const emailResult = await sendAccessConfirmedEmail({
      to: normalizedNew,
      studentName: buyerName,
      courseTitle: course.title,
      courseSlug: course.slug,
      activationToken: t.token,
    });
    if (!emailResult.success) {
      console.error("[correct-email] email error:", emailResult.error);
      continue;
    }
    sent++;
  }

  await service.from("audit_log").insert({
    admin_id: adminId,
    action: "correct_buyer_email",
    target_type: "activation_token",
    target_id: null,
    meta: {
      old_email: normalizedOld,
      new_email: normalizedNew,
      tokens_updated: ids.length,
      emails_sent: sent,
      admin_name: adminName,
    },
  });

  return { sent };
}

// ─── Criar conta + definir senha (aluna sem cadastro) ─────────────────────────

export async function createAccountAndSetPasswordAction(
  email: string,
  password: string
): Promise<{ error?: string; userId?: string }> {
  let adminId: string;
  try {
    ({ adminId } = await assertAdmin());
  } catch (e) {
    return { error: (e as Error).message };
  }

  const service = createServiceClient();

  if (password.length < 8) return { error: "A senha deve ter no mínimo 8 caracteres." };

  const normalizedEmail = email.toLowerCase().trim();

  // Garante que não existe conta com este e-mail
  const { data: existingProfile } = await service
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (existingProfile) return { error: "Esta aluna já possui uma conta." };

  // Busca dados da compra (nome, telefone, cursos) via tokens pendentes
  const { data: tokens } = await service
    .from("activation_tokens")
    .select("token, course_id, buyer_name, buyer_phone")
    .eq("email", normalizedEmail)
    .eq("used", false)
    .not("course_id", "is", null);

  const buyerName = tokens?.[0]?.buyer_name ?? null;
  const buyerPhone = tokens?.[0]?.buyer_phone ?? null;

  // email_confirm: true libera o acesso imediatamente, sem exigir confirmação
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: buyerName },
  });

  if (createError) {
    const msg = createError.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return { error: "Já existe uma conta com este e-mail." };
    }
    return { error: `Erro ao criar conta: ${createError.message}` };
  }

  const userId = created.user.id;

  const profileUpdate: Record<string, string> = {};
  if (buyerName) profileUpdate.full_name = buyerName;
  if (buyerPhone) profileUpdate.phone = buyerPhone;
  if (Object.keys(profileUpdate).length > 0) {
    await updateProfileWithRetry(service, userId, profileUpdate);
  }

  // Concede matrícula em cada curso comprado e marca os tokens como usados
  let enrollmentsGranted = 0;
  for (const t of tokens ?? []) {
    if (!t.course_id) continue;
    const { error: enrollErr } = await service.from("enrollments").insert({
      user_id: userId,
      course_id: t.course_id,
      source: "payt",
      granted_at: new Date().toISOString(),
      expires_at: null,
    });
    if (!enrollErr) enrollmentsGranted++;
    await service.from("activation_tokens").update({ used: true }).eq("token", t.token);
  }

  await service.from("audit_log").insert({
    admin_id: adminId,
    action: "create_account_with_password",
    target_type: "user",
    target_id: userId,
    meta: { email: normalizedEmail, enrollments_granted: enrollmentsGranted },
  });

  revalidatePath("/admin/alunos");
  return { userId };
}
