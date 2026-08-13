"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Não autorizado");
  return { supabase, user };
}

// ─── Blocos ────────────────────────────────────────────────────────────────────

const BlockSchema = z.object({
  type: z.enum(["text", "html", "embed", "download", "video"]),
  content: z.string().min(1, "Conteúdo obrigatório"),
  position: z.number().int().min(0),
});

export async function upsertBlock(
  lessonId: string,
  blockId: string | null,
  data: { type: string; content: string; position: number }
): Promise<{ id: string; type: "text" | "html" | "embed" | "download" | "video"; content: string; position: number }> {
  await assertAdmin();
  const validated = BlockSchema.parse(data);

  const supabase = await createClient();

  if (blockId) {
    const { error } = await supabase
      .from("lesson_content_blocks")
      .update({ ...validated, lesson_id: lessonId })
      .eq("id", blockId);
    if (error) throw new Error("Erro ao atualizar bloco: " + error.message);
    revalidatePath(`/aulas/${lessonId}`);
    return { id: blockId, ...validated };
  } else {
    const { data: inserted, error } = await supabase
      .from("lesson_content_blocks")
      .insert({ ...validated, lesson_id: lessonId })
      .select("id")
      .single();
    if (error) throw new Error("Erro ao criar bloco: " + error.message);
    revalidatePath(`/aulas/${lessonId}`);
    return { id: inserted.id as string, ...validated };
  }
}

export async function deleteBlock(blockId: string): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("lesson_content_blocks")
    .delete()
    .eq("id", blockId);
  if (error) throw new Error("Erro ao deletar bloco: " + error.message);
}

export async function reorderBlocks(
  blocks: { id: string; position: number }[]
): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();

  await Promise.all(
    blocks.map(({ id, position }) =>
      supabase.from("lesson_content_blocks").update({ position }).eq("id", id)
    )
  );
}

// ─── Materiais ─────────────────────────────────────────────────────────────────

const MaterialSchema = z.object({
  name: z.string().min(1).max(200),
  lessonId: z.string().uuid(),
});

// Upload direto do browser pro Supabase Storage via URL assinada — o arquivo
// nunca passa pela Server Action. Necessário porque as Serverless Functions da
// Vercel têm limite de 4,5MB de corpo de requisição (fixo, não configurável),
// bem abaixo do limite de 50MB validado no bucket.
export async function createMaterialUploadUrl(
  lessonId: string,
  fileName: string
): Promise<{ path: string; token: string }> {
  await assertAdmin();
  const ext = fileName.split(".").pop() ?? "bin";
  const filePath = `${lessonId}/${Date.now()}.${ext}`;
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient.storage
    .from("lesson-materials")
    .createSignedUploadUrl(filePath);
  if (error || !data) throw new Error("Erro ao preparar upload: " + (error?.message ?? "desconhecido"));

  return { path: data.path, token: data.token };
}

export async function finalizeMaterialUpload(
  lessonId: string,
  filePath: string,
  name: string
): Promise<void> {
  await assertAdmin();

  MaterialSchema.parse({ name, lessonId });

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("lesson_materials").insert({
    lesson_id: lessonId,
    name,
    file_path: filePath,
  });

  if (insertError) {
    // Remove arquivo órfão se o insert falhar
    const serviceClient = createServiceClient();
    await serviceClient.storage.from("lesson-materials").remove([filePath]);
    throw new Error("Erro ao salvar material: " + insertError.message);
  }

  revalidatePath(`/aulas/${lessonId}`);
}

export async function deleteMaterial(materialId: string): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();

  const { data: material } = await supabase
    .from("lesson_materials")
    .select("file_path, lesson_id")
    .eq("id", materialId)
    .single();

  if (!material) throw new Error("Material não encontrado");

  const { error } = await supabase
    .from("lesson_materials")
    .delete()
    .eq("id", materialId);

  if (error) throw new Error("Erro ao deletar material: " + error.message);

  // Só remove do Storage se nenhuma outra aula referencia o mesmo arquivo
  const { count } = await supabase
    .from("lesson_materials")
    .select("id", { count: "exact", head: true })
    .eq("file_path", material.file_path);

  if ((count ?? 0) === 0) {
    const serviceClient = createServiceClient();
    await serviceClient.storage
      .from("lesson-materials")
      .remove([material.file_path]);
  }

  revalidatePath(`/aulas/${material.lesson_id}`);
}

export async function listAllMaterials(currentLessonId: string): Promise<
  Array<{
    id: string;
    name: string;
    file_path: string;
    lesson_id: string;
    lesson_title: string;
    course_title: string;
  }>
> {
  await assertAdmin();
  const service = createServiceClient();

  const { data } = await service
    .from("lesson_materials")
    .select("id, name, file_path, lesson_id, lessons!lesson_id(title, modules!module_id(courses!course_id(title)))")
    .neq("lesson_id", currentLessonId)
    .order("name");

  return (data ?? []).map((m: any) => ({
    id: m.id,
    name: m.name,
    file_path: m.file_path,
    lesson_id: m.lesson_id,
    lesson_title: m.lessons?.title ?? "—",
    course_title: m.lessons?.modules?.courses?.title ?? "—",
  }));
}

export async function linkMaterial(data: {
  lessonId: string;
  name: string;
  filePath: string;
}): Promise<void> {
  await assertAdmin();

  z.object({
    lessonId: z.string().uuid(),
    name: z.string().min(1).max(200),
    filePath: z.string().min(1),
  }).parse({ lessonId: data.lessonId, name: data.name, filePath: data.filePath });

  const supabase = await createClient();
  const { error } = await supabase.from("lesson_materials").insert({
    lesson_id: data.lessonId,
    name: data.name,
    file_path: data.filePath,
  });

  if (error) throw new Error("Erro ao vincular material: " + error.message);
  revalidatePath(`/aulas/${data.lessonId}`);
}
