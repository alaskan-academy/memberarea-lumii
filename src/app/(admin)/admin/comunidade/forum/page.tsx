import { createClient } from "@/lib/supabase/server";
import { escapeLike } from "@/lib/supabase/escape-like";
import { MessageSquare } from "lucide-react";
import ForumModerationClient from "./ForumModerationClient";
import ForumSearch from "./ForumSearch";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/current-admin";

export const metadata = { title: "Fórum — Moderação Admin Lumii" };

const PAGE_SIZE = 20;
// A fila de moderação (pendentes) precisa ficar sempre visível de uma vez —
// paginar esconderia posts aguardando aprovação há mais tempo. Um teto alto
// evita, mesmo assim, um full-scan sem limite nenhum.
const PENDING_CAP = 300;

type PostRaw = {
  id: string; title: string; body: string; pinned: boolean; approved: boolean;
  created_at: string; forum_id: string | null;
  attachment_url: string | null; attachment_name: string | null;
  author: { full_name: string } | null;
  forums: { title: string; slug: string } | null;
  forum_comments: [{ count: number }];
};

function mapPost(p: PostRaw) {
  return {
    id: p.id,
    title: p.title,
    body: p.body,
    pinned: p.pinned,
    approved: p.approved ?? true,
    created_at: p.created_at,
    forum_id: p.forum_id,
    attachment_url: p.attachment_url,
    attachment_name: p.attachment_name,
    author_name: p.author?.full_name ?? "—",
    forum_title: p.forums?.title ?? "—",
    forum_slug: p.forums?.slug ?? "",
    comment_count: (p.forum_comments as unknown as [{ count: number }])[0]?.count ?? 0,
  };
}

export default async function AdminForumPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await getCurrentAdmin();
  const supabase = await createClient();

  const { page: rawPage, q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? "";
  const page = Math.max(1, parseInt(rawPage ?? "1"));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const selectCols = `
      id, title, body, pinned, approved, created_at, forum_id,
      attachment_url, attachment_name,
      author:profiles!user_id (full_name),
      forums!forum_id (title, slug),
      forum_comments(count)
    `;

  let pendingQuery = supabase
    .from("forum_posts")
    .select(selectCols)
    .eq("approved", false)
    .order("created_at", { ascending: false })
    .limit(PENDING_CAP);
  if (q) pendingQuery = pendingQuery.ilike("title", `%${escapeLike(q)}%`);

  let approvedQuery = supabase
    .from("forum_posts")
    .select(selectCols, { count: "exact" })
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (q) approvedQuery = approvedQuery.ilike("title", `%${escapeLike(q)}%`);

  const [{ data: pendingRaw }, { data: approvedRaw, count: approvedCount }] = await Promise.all([
    pendingQuery,
    approvedQuery,
  ]);

  const pending = ((pendingRaw as unknown as PostRaw[]) ?? []).map(mapPost);
  const approved = ((approvedRaw as unknown as PostRaw[]) ?? []).map(mapPost);
  const posts = [...pending, ...approved];
  const pendingCount = pending.length;
  const totalPages = Math.max(1, Math.ceil((approvedCount ?? 0) / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-lumii-coral/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-lumii-coral" />
        </div>
        <div>
          <h1 className="font-black text-xl text-foreground">Moderação do Fórum</h1>
          <p className="text-sm text-muted-foreground">
            {pendingCount > 0 ? (
              <span className="text-lumii-yellow font-semibold">{pendingCount} aguardando aprovação</span>
            ) : (
              "Nenhum post pendente"
            )}
            {" · "}{approvedCount ?? 0} posts aprovados no total
          </p>
        </div>
      </div>

      <div className="mb-4">
        <ForumSearch defaultValue={q} />
      </div>

      <ForumModerationClient posts={posts} />

      {/* Paginação — apenas a lista de posts aprovados é paginada; pendentes ficam sempre visíveis */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${page - 1}`}
              className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
            >
              ← Anterior
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Aprovados: página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${page + 1}`}
              className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
            >
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
