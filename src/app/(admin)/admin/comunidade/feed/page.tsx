import { createClient } from "@/lib/supabase/server";
import FeedAdminClient, { type AdminNewsPost } from "./FeedAdminClient";
import { Newspaper } from "lucide-react";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/current-admin";

export const metadata = { title: "Avisos — Admin Lumii" };

const PAGE_SIZE = 20;

export default async function AdminFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  await getCurrentAdmin();
  const supabase = await createClient();

  const { page: rawPage, status: rawStatus } = await searchParams;
  const status = rawStatus === "published" || rawStatus === "draft" ? rawStatus : "all";
  const page = Math.max(1, parseInt(rawPage ?? "1"));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("news_posts")
    .select(`
      id, title, body, image_url, pinned, published, created_at,
      author:profiles!author_id (full_name),
      news_comments(count)
    `, { count: "exact" })
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status === "published") query = query.eq("published", true);
  if (status === "draft") query = query.eq("published", false);

  const { data: postsRaw, count } = await query;

  const posts: AdminNewsPost[] = (postsRaw ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    image_url: p.image_url ?? null,
    pinned: p.pinned,
    published: p.published,
    created_at: p.created_at,
    author: (p.author as unknown as { full_name: string } | null),
    comment_count: (p.news_comments as unknown as [{ count: number }])[0]?.count ?? 0,
  }));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const tabHref = (s: string) => `?${s === "all" ? "" : `status=${s}`}`;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#f6614f]/10 flex items-center justify-center">
          <Newspaper className="w-5 h-5 text-[#f6614f]" />
        </div>
        <div>
          <h1 className="font-black text-xl text-foreground">Avisos</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie publicações para as alunas</p>
        </div>
      </div>

      {/* Filtro por status */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-1 -mb-px">
          {([
            { value: "all", label: "Todos" },
            { value: "published", label: "Publicados" },
            { value: "draft", label: "Rascunhos" },
          ] as const).map((t) => (
            <Link
              key={t.value}
              href={tabHref(t.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                status === t.value
                  ? "border-[#f6614f] text-[#f6614f]"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      <FeedAdminClient posts={posts} />

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`?${status !== "all" ? `status=${status}&` : ""}page=${page - 1}`}
              className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
            >
              ← Anterior
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`?${status !== "all" ? `status=${status}&` : ""}page=${page + 1}`}
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
