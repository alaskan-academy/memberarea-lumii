"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { assertAdmin } from "@/lib/supabase/admin-guard";
import { z } from "zod";
import { encryptCpf, hashCpf } from "@/lib/cpf-crypto";
import { traduzErroAuth } from "@/lib/auth/mensagens-erro";

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
        console.error("[createStudent] erro ao atualizar profile:", error.message);
        return false;
      }
      return true;
    }

    if (attempt < delays.length) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
  }
  console.error(`[createStudent] profile de ${userId} não apareceu após retries — trigger pode ter falhado`);
  return false;
}

const createSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional(),
  phone: z.string().max(30).optional(),
  date_of_birth: z.string().optional(),
  cpf: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.replace(/\D/g, "").length === 11,
      "CPF deve ter 11 dígitos"
    ),
});

export async function createStudentAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await assertAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const rawPassword = ((formData.get("password") as string) ?? "").trim();
  const rawCpf = ((formData.get("cpf") as string) ?? "").replace(/\D/g, "");

  const parsed = createSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: rawPassword || undefined,
    phone: (formData.get("phone") as string)?.trim() || undefined,
    date_of_birth: (formData.get("date_of_birth") as string) || undefined,
    cpf: rawCpf || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (rawPassword && rawPassword.length < 6) {
    return { error: "Senha deve ter ao menos 6 caracteres" };
  }

  const { full_name, email, phone, date_of_birth } = parsed.data;

  const password =
    rawPassword.length >= 8
      ? rawPassword
      : Math.random().toString(36).slice(-10) +
        Math.random().toString(36).slice(-10).toUpperCase() +
        "!1";

  const service = createServiceClient();

  const { data: created, error: authErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (authErr) {
    console.error("[createStudent] auth error:", authErr);
    if (authErr.message.includes("already registered")) {
      const { data: existing } = await service
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();
      if (existing?.id) redirect(`/admin/alunos/${existing.id}`);
      return { error: "Este e-mail já está cadastrado." };
    }
    return { error: traduzErroAuth(authErr.message) ?? "Não foi possível criar a aluna. Verifique os dados e tente novamente." };
  }

  // Campos extras além do que o trigger já preenche
  const extras: Record<string, unknown> = {};
  if (phone) extras.phone = phone;
  if (date_of_birth) extras.date_of_birth = date_of_birth;
  if (rawCpf.length === 11) {
    extras.cpf_encrypted = encryptCpf(rawCpf);
    extras.cpf_hash = hashCpf(rawCpf);
  }

  if (Object.keys(extras).length > 0) {
    await updateProfileWithRetry(service, created.user.id, extras);
  }

  redirect(`/admin/alunos/${created.user.id}`);
}
