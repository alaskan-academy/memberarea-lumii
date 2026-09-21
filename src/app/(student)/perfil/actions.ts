"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { prepareImageForUpload } from "@/lib/images/to-webp";

// ─── Certificados ─────────────────────────────────────────────────────────────

export async function getCertificateDownloadUrl(
  certificateId: string
): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: cert } = await supabase
    .from("certificates")
    .select("pdf_path")
    .eq("id", certificateId)
    .eq("user_id", user.id)
    .single();

  if (!cert?.pdf_path) return null;

  const serviceClient = createServiceClient();
  const { data } = await serviceClient.storage
    .from("certificates")
    .createSignedUrl(cert.pdf_path, 3600);

  return data?.signedUrl ?? null;
}

// ─── Perfil ───────────────────────────────────────────────────────────────────

// Limites server-side (o maxLength do form é só UX, burlável). Alinha com o
// schema do admin (full_name máx. 200); bio até 500. Nome e bio são exibidos a
// outras alunas (comunidade, Inspirações), então não podem ir crus pro banco.
const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Nome não pode ser vazio").max(200, "Nome muito longo (máximo 200 caracteres)"),
  bio: z.string().trim().max(500, "Bio muito longa (máximo 500 caracteres)").optional().default(""),
});

export async function updateProfile(data: {
  fullName: string;
  bio: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      bio: parsed.data.bio || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/perfil");
  return {};
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "Nenhum arquivo enviado" };
  if (file.size > 5 * 1024 * 1024) return { error: "Tamanho máximo: 5 MB" };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return { error: "Formato inválido. Use JPG, PNG ou WebP." };

  const prepared = await prepareImageForUpload(file);
  const path = `${user.id}.${prepared.ext}`;

  const serviceClient = createServiceClient();

  const { error: uploadError } = await serviceClient.storage
    .from("avatars")
    .upload(path, prepared.buffer, { upsert: true, contentType: prepared.contentType });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = serviceClient.storage.from("avatars").getPublicUrl(path);

  const urlWithBust = `${publicUrl}?t=${Date.now()}`;

  await supabase
    .from("profiles")
    .update({ avatar_url: urlWithBust })
    .eq("id", user.id);

  revalidatePath("/perfil");
  return { url: urlWithBust };
}

// ─── Senha ────────────────────────────────────────────────────────────────────

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Não autenticado" };

  if (data.newPassword.length < 6) return { error: "A nova senha deve ter pelo menos 6 caracteres." };

  // Verifica senha atual via re-autenticação
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: data.currentPassword,
  });
  if (signInError) return { error: "Senha atual incorreta." };

  const { error } = await supabase.auth.updateUser({ password: data.newPassword });
  if (error) return { error: error.message };
  return {};
}

// ─── Preferências de e-mail ───────────────────────────────────────────────────

export type EmailPrefs = {
  certificate: boolean;
  reengagement: boolean;
  news_post: boolean;
  new_course: boolean;
};

export async function updateEmailPrefs(
  prefs: EmailPrefs
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({ email_prefs: prefs })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}
