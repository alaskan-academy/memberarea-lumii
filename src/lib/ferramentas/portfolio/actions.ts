"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { prepareImageForUpload } from "@/lib/images/to-webp";

const BUCKET = "portfolio";
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024; // rede de segurança; o client já comprime bem menor

function fichaPath(studentId: string): string {
  return `/ferramentas/meus-alunos/aluno/${studentId}`;
}

const TextSchema = z.object({
  student_id: z.string().uuid(),
  titulo: z.string().trim().min(1, "Dê um título").max(200),
  descricao: z.string().trim().max(2000).optional(),
});

/**
 * Cria um item de portfólio, com foto opcional. FormData porque pode carregar um
 * arquivo. A foto vai para {teacher_id}/{student_id}/{uuid} no bucket privado
 * (o path começa com o id do professor = auth.uid(), casando com a RLS do bucket).
 */
export async function createPortfolioItem(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = TextSchema.safeParse({
    student_id: formData.get("student_id"),
    titulo: formData.get("titulo"),
    descricao: (formData.get("descricao") as string | null) || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Defesa extra além do RLS: o aluno é deste professor.
  const { data: student } = await supabase
    .from("teacher_students")
    .select("id")
    .eq("id", parsed.data.student_id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!student) return { error: "Aluno não encontrado" };

  let anexoPath: string | null = null;
  let anexoMime: string | null = null;

  const file = formData.get("foto") as File | null;
  if (file && file.size > 0) {
    if (file.size > MAX_BYTES) return { error: "Foto muito grande (máx 8MB)" };
    if (!ALLOWED_MIME.includes(file.type)) return { error: "Apenas imagens (JPEG, PNG, WebP, GIF)" };

    const service = createServiceClient();
    const prepared = await prepareImageForUpload(file);
    // path começa com user.id → a policy do bucket (foldername[1] = auth.uid()) permite.
    const path = `${user.id}/${parsed.data.student_id}/${crypto.randomUUID()}.${prepared.ext}`;
    const { error: upErr } = await service.storage
      .from(BUCKET)
      .upload(path, prepared.buffer, { contentType: prepared.contentType, upsert: false });
    if (upErr) return { error: "Erro ao enviar a foto" };
    anexoPath = path;
    anexoMime = prepared.contentType;
  }

  const { data, error } = await supabase
    .from("student_portfolio")
    .insert({
      teacher_id: user.id,
      student_id: parsed.data.student_id,
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao || null,
      anexo_path: anexoPath,
      anexo_mime: anexoMime,
    })
    .select("id")
    .single();

  if (error) {
    // Rollback: se a linha não gravou, remove a foto órfã.
    if (anexoPath) await createServiceClient().storage.from(BUCKET).remove([anexoPath]);
    return { error: error.message };
  }

  revalidatePath(fichaPath(parsed.data.student_id));
  return { id: data.id };
}

const UpdateSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().trim().min(1, "Dê um título").max(200),
  descricao: z.string().trim().max(2000).optional(),
});

export async function updatePortfolioItem(
  input: z.infer<typeof UpdateSchema>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: item } = await supabase
    .from("student_portfolio")
    .select("id, student_id")
    .eq("id", parsed.data.id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!item) return { error: "Item não encontrado" };

  const { error } = await supabase
    .from("student_portfolio")
    .update({ titulo: parsed.data.titulo, descricao: parsed.data.descricao || null, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };
  revalidatePath(fichaPath(item.student_id));
  return {};
}

export async function deletePortfolioItem(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "Item inválido" };

  const { data: item } = await supabase
    .from("student_portfolio")
    .select("id, student_id, anexo_path")
    .eq("id", parsed.data)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!item) return { error: "Item não encontrado" };

  // Remove a foto do storage antes de apagar a linha (evita órfão).
  if (item.anexo_path) {
    await createServiceClient().storage.from(BUCKET).remove([item.anexo_path]);
  }

  const { error } = await supabase.from("student_portfolio").delete().eq("id", parsed.data);
  if (error) return { error: error.message };
  revalidatePath(fichaPath(item.student_id));
  return {};
}
