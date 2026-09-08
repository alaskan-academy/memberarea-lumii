"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/supabase/admin-guard";

export async function approveForumPost(postId: string, forumSlug: string): Promise<{ error?: string }> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("forum_posts").update({ approved: true }).eq("id", postId);
  if (error) return { error: "Erro ao aprovar post" };
  revalidatePath("/admin/comunidade/forum");
  revalidatePath(`/comunidade/forum/${forumSlug}`);
  return {};
}

export async function rejectForumPost(postId: string, forumSlug: string): Promise<{ error?: string }> {
  const { supabase, adminId } = await assertAdmin();
  const { error } = await supabase.from("forum_posts").delete().eq("id", postId);
  if (error) return { error: "Erro ao rejeitar post" };
  await createServiceClient().from("audit_log").insert({
    admin_id: adminId, action: "reject_forum_post",
    target_type: "forum_post", target_id: postId,
    meta: { forum_slug: forumSlug },
  });
  revalidatePath("/admin/comunidade/forum");
  revalidatePath(`/comunidade/forum/${forumSlug}`);
  return {};
}

export async function deleteAdminForumPost(postId: string, forumSlug: string): Promise<{ error?: string }> {
  const { supabase, adminId } = await assertAdmin();
  const { error } = await supabase.from("forum_posts").delete().eq("id", postId);
  if (error) return { error: "Erro ao deletar post" };
  await createServiceClient().from("audit_log").insert({
    admin_id: adminId, action: "delete_forum_post",
    target_type: "forum_post", target_id: postId,
    meta: { forum_slug: forumSlug },
  });
  revalidatePath("/admin/comunidade/forum");
  revalidatePath(`/comunidade/forum/${forumSlug}`);
  return {};
}

export async function toggleAdminForumPin(postId: string, currentPinned: boolean): Promise<{ error?: string }> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("forum_posts").update({ pinned: !currentPinned }).eq("id", postId);
  if (error) return { error: "Erro ao alterar fixação" };
  revalidatePath("/admin/comunidade/forum");
  return {};
}
