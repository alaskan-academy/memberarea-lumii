import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import {
  Users, BookOpen, Award, TrendingUp,
  ShoppingBag, Image as ImageIcon, Bell, Newspaper,
  BarChart3, CheckCircle2, Clock, XCircle, Webhook,
  ArrowRight, AlertTriangle, Flag, MessageCircle, Sparkles, PlusCircle,
} from "lucide-react";
import { assertAdminPage } from "@/lib/supabase/admin-guard";

const QUICK_ACTION_GROUPS = [
  {
    label: "Catálogo",
    items: [
      { href: "/admin/cursos",  icon: BookOpen, label: "Cursos",  desc: "Gerenciar catálogo e aulas",  color: "#f6614f" },
      { href: "/admin/alunos",  icon: Users,    label: "Alunas",  desc: "Matrículas e progresso",       color: "#71c69a" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/banners",      icon: ImageIcon, label: "Banners",       desc: "Promoções e destaques",       color: "#eebc3e" },
      { href: "/admin/notificacoes", icon: Bell,      label: "Notificações",  desc: "Enviar avisos para alunas",   color: "#f6614f" },
    ],
  },
  {
    label: "Comunidade",
    items: [
      { href: "/admin/comunidade/feed",  icon: Newspaper, label: "Avisos",             desc: "Publicar avisos e novidades", color: "#71c69a" },
      { href: "/admin/comunidade/forum", icon: Flag,      label: "Moderação do Fórum", desc: "Aprovar e moderar posts",     color: "#f6614f" },
    ],
  },
  {
    label: "Inspirações",
    items: [
      { href: "/admin/inspiracoes",             icon: Sparkles,      label: "Posts",        desc: "Gerenciar feed de inspirações",  color: "#f6614f" },
      { href: "/admin/inspiracoes/novo",        icon: PlusCircle,    label: "Novo post",    desc: "Criar foto, vídeo, atividade...", color: "#71c69a" },
      { href: "/admin/inspiracoes/comentarios", icon: MessageCircle, label: "Comentários",  desc: "Aprovar comentários das alunas", color: "#eebc3e" },
    ],
  },
];

export default async function AdminHomePage() {
  const { supabase, user } = await assertAdminPage();
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const adminName = adminProfile?.full_name as string | null;
  const service = createServiceClient();

  const hourBRT = (new Date().getUTCHours() - 3 + 24) % 24;
  const greeting = hourBRT < 12 ? "Bom dia" : hourBRT < 18 ? "Boa tarde" : "Boa noite";
  // `|| "Admin"` (não `??`): full_name pode ser string vazia "" no banco, que
  // o nullish coalescing não pega — resultava em "Boa tarde, !" sem nome.
  const firstName = adminName?.split(" ")[0] || "Admin";

  const now = new Date().toISOString();

  const [
    { count: totalAlunas },
    { count: totalMatriculas },
    { count: totalCertificados },
    { count: cursosPublicados },
    { data: webhooks },
    { count: pendingReports },
    { count: pendingForumPosts },
    { count: totalForumPosts },
    { count: pendingInspComments },
  ] = await Promise.all([
    service
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .eq("banned", false),

    service
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .or(`expires_at.is.null,expires_at.gte.${now}`),

    service
      .from("certificates")
      .select("*", { count: "exact", head: true }),

    service
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("published", true),

    service
      .from("payment_events")
      .select("id, event_type, buyer_email, product_code, processed, error, created_at")
      .order("created_at", { ascending: false })
      .limit(8),

    service
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("resolved", false),

    service
      .from("forum_posts")
      .select("*", { count: "exact", head: true })
      .eq("approved", false),

    service
      .from("forum_posts")
      .select("*", { count: "exact", head: true }),

    service
      .from("inspiration_comments")
      .select("*", { count: "exact", head: true })
      .eq("approved", false),
  ]);

  const taxaConclusao =
    totalMatriculas && totalMatriculas > 0
      ? Math.round(((totalCertificados ?? 0) / totalMatriculas) * 100)
      : 0;

  const KPI_CARDS = [
    { icon: Users,      label: "Alunas ativas",     value: totalAlunas ?? 0,      color: "#f6614f", href: "/admin/alunos?tab=cadastradas" },
    { icon: BookOpen,   label: "Matrículas ativas",  value: totalMatriculas ?? 0,   color: "#71c69a", href: "/admin/metricas/alunas" },
    { icon: Award,      label: "Certificados",        value: totalCertificados ?? 0, color: "#eebc3e", href: "/admin/metricas/certificados" },
    { icon: TrendingUp, label: "Taxa de conclusão",   value: `${taxaConclusao}%`,   color: "#f6614f", href: "/admin/metricas/conclusao" },
  ];

  return (
    <div className="space-y-8">

      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting},{" "}
          <span className="text-lumii-coral">{firstName}!</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Alertas de moderação */}
      {((pendingReports ?? 0) > 0 || (pendingForumPosts ?? 0) > 0 || (pendingInspComments ?? 0) > 0) && (
        <div className="space-y-2">
          {(pendingReports ?? 0) > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-lumii-yellow/15 border border-lumii-yellow/40">
              <AlertTriangle className="w-5 h-5 text-[#b07d00] shrink-0" />
              <p className="text-sm font-medium text-foreground flex-1">
                <span className="font-bold">{pendingReports}</span>{" "}
                {pendingReports === 1 ? "denúncia aguarda" : "denúncias aguardam"} revisão
              </p>
              <Link
                href="/admin/comunidade/forum"
                className="text-xs font-semibold text-lumii-coral hover:underline flex items-center gap-1 shrink-0"
              >
                Revisar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
          {(pendingForumPosts ?? 0) > 0 && (
            <Link
              href="/admin/comunidade/forum"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-lumii-coral/10 border border-lumii-coral/30 hover:bg-lumii-coral/15 transition-colors"
            >
              <Flag className="w-5 h-5 text-lumii-coral shrink-0" />
              <p className="text-sm font-medium text-foreground flex-1">
                <span className="font-bold text-lumii-coral">{pendingForumPosts}</span>{" "}
                {pendingForumPosts === 1 ? "post aguarda aprovação" : "posts aguardam aprovação"}
                {" · "}
                <span className="text-foreground/50">{totalForumPosts ?? 0} no total</span>
              </p>
              <ArrowRight className="w-4 h-4 text-lumii-coral shrink-0" />
            </Link>
          )}
          {(pendingInspComments ?? 0) > 0 && (
            <Link
              href="/admin/inspiracoes/comentarios"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-lumii-coral/10 border border-lumii-coral/30 hover:bg-lumii-coral/15 transition-colors"
            >
              <Sparkles className="w-5 h-5 text-lumii-coral shrink-0" />
              <p className="text-sm font-medium text-foreground flex-1">
                <span className="font-bold text-lumii-coral">{pendingInspComments}</span>{" "}
                {pendingInspComments === 1 ? "comentário de inspiração aguarda" : "comentários de inspirações aguardam"} aprovação
              </p>
              <ArrowRight className="w-4 h-4 text-lumii-coral shrink-0" />
            </Link>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(({ icon: Icon, label, value, color, href }) => (
          <Link key={label} href={href} className="lumii-card p-5 block hover:border-lumii-coral/40 hover:shadow-md transition-all">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
              style={{ background: color + "20" }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-foreground/50 mt-1 font-medium">{label}</p>
          </Link>
        ))}
      </div>

      {/* Atalhos rápidos — grid 3 colunas full-width */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
          Acesso rápido
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_ACTION_GROUPS.flatMap((g) => g.items).map(({ href, icon: Icon, label, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="lumii-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: color + "20" }}
              >
                <Icon className="w-5 h-5 shrink-0" style={{ color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-foreground/50 mt-0.5 truncate">{desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-foreground/20 group-hover:text-lumii-coral transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Webhooks + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Webhooks recentes */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
              Últimos pagamentos
            </h2>
            <Link href="/admin/metricas" className="text-xs text-lumii-coral hover:underline font-medium">
              Ver todos
            </Link>
          </div>
          <div className="lumii-card divide-y divide-border/50">
            {(webhooks ?? []).length === 0 ? (
              <p className="p-4 text-sm text-foreground/40">Nenhum webhook ainda.</p>
            ) : (
              (webhooks ?? []).map((w) => (
                <div key={w.id} className="flex items-start gap-3 p-3">
                  <WebhookDot processed={w.processed} error={w.error} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {w.buyer_email ?? "—"}
                    </p>
                    <p className="text-[11px] text-foreground/40 mt-0.5">
                      <code className="bg-lumii-gray/6 px-1 rounded">{w.event_type}</code>
                      {" · "}
                      {new Date(w.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar direita — Métricas + Cursos publicados */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
            Visão geral
          </h2>
          <div className="lumii-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lumii-green/20 flex items-center justify-center shrink-0">
              <Webhook className="w-4 h-4 text-lumii-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-foreground/40 font-medium uppercase tracking-wide">Cursos publicados</p>
              <p className="text-xl font-bold text-foreground">{cursosPublicados ?? 0}</p>
            </div>
            <Link href="/admin/cursos" className="text-xs font-semibold text-lumii-coral hover:underline flex items-center gap-1 shrink-0">
              Ver <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <Link
            href="/admin/metricas"
            className="lumii-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group"
          >
            <div className="w-9 h-9 rounded-xl bg-lumii-coral/10 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-lumii-coral" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Métricas completas</p>
              <p className="text-xs text-foreground/50">Top cursos, funil, vídeos</p>
            </div>
            <ArrowRight className="w-4 h-4 text-foreground/20 group-hover:text-lumii-coral transition-colors shrink-0" />
          </Link>
        </div>
      </div>

    </div>
  );
}

function WebhookDot({
  processed,
  error,
}: {
  processed: boolean | null;
  error: string | null;
}) {
  if (error)
    return <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
  if (processed)
    return <CheckCircle2 className="w-4 h-4 text-lumii-green shrink-0 mt-0.5" />;
  return <Clock className="w-4 h-4 text-lumii-yellow shrink-0 mt-0.5" />;
}
