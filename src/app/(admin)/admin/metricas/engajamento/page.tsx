import { createServiceClient } from "@/lib/supabase/service";
import EngajamentoPage, { type EngajamentoEntry } from "@/components/admin/metrics/EngajamentoPage";
import { getCurrentAdmin } from "@/lib/auth/current-admin";

// Página de BI/relatório — ranking e totais agregados no banco via RPC.
export const revalidate = 300;

type RankRpcRow = {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  forum_posts: number;
  forum_comments: number;
  suggestions: number;
  lessons_completed: number;
  insp_likes: number;
  insp_bookmarks: number;
  insp_comments: number;
  score: number;
};

type TotalsRpcRow = {
  posts: number;
  comments: number;
  suggestions: number;
  lessons_completed: number;
  active_students: number;
  insp_likes: number;
  insp_bookmarks: number;
  insp_comments: number;
};

export default async function EngajamentoAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  await getCurrentAdmin();

  const { periodo } = await searchParams;
  const days = periodo === "7d" ? 7 : periodo === "30d" ? 30 : null;
  // Server Component executado uma vez por request — Date.now() aqui não tem
  // o problema de instabilidade de render que a regra react-hooks/purity mira
  // em Client Components.
  // eslint-disable-next-line react-hooks/purity
  const since = days
    ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const service = createServiceClient();

  const [{ data: rankingRpc }, { data: totalsRpc }] = await Promise.all([
    service.rpc("admin_engagement_ranking", { since, limit_n: 20 }),
    service.rpc("admin_engagement_totals", { since }),
  ]);

  const rankingRows = (rankingRpc ?? []) as RankRpcRow[];
  const totalsRow = (totalsRpc?.[0] ?? null) as TotalsRpcRow | null;

  const ranking: EngajamentoEntry[] = rankingRows.map((r) => ({
    userId: r.user_id,
    profile: { full_name: r.full_name, email: r.email, avatar_url: r.avatar_url },
    score: r.score,
    forumPosts: r.forum_posts,
    forumComments: r.forum_comments,
    suggestions: r.suggestions,
    lessonsCompleted: r.lessons_completed,
    inspLikes: r.insp_likes,
    inspBookmarks: r.insp_bookmarks,
    inspComments: r.insp_comments,
  }));

  const totals = {
    posts: totalsRow?.posts ?? 0,
    comments: totalsRow?.comments ?? 0,
    suggestions: totalsRow?.suggestions ?? 0,
    lessonsCompleted: totalsRow?.lessons_completed ?? 0,
    activeStudents: totalsRow?.active_students ?? 0,
    inspLikes: totalsRow?.insp_likes ?? 0,
    inspBookmarks: totalsRow?.insp_bookmarks ?? 0,
    inspComments: totalsRow?.insp_comments ?? 0,
  };

  return (
    <EngajamentoPage ranking={ranking} totals={totals} periodo={periodo ?? "all"} />
  );
}
