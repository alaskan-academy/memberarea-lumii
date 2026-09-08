import { createServiceClient } from "@/lib/supabase/service";
import { Trophy, BookOpen, Award, Activity, UserCheck, Clock } from "lucide-react";
import { InfoTooltip } from "../MetricTooltip";
import Image from "next/image";
import { FinancialRankings, type StudentRow, type CourseEnroll } from "./FinancialRankings";
import { StudentMiniModal } from "@/components/admin/metrics/StudentMiniModal";
import { getCurrentAdmin } from "@/lib/auth/current-admin";

// Página de BI/relatório — rankings agregados no banco via RPC, não precisa ser real-time.
export const revalidate = 300;

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
};

type LessonRankRow = { user_id: string; full_name: string | null; email: string; avatar_url: string | null; lesson_count: number };
type CertRankRow = { user_id: string; full_name: string | null; email: string; avatar_url: string | null; certificate_count: number };
type EnrollRankRow = { user_id: string; full_name: string | null; email: string; avatar_url: string | null; enrollment_count: number };
type ActiveRankRow = { user_id: string; full_name: string | null; email: string; avatar_url: string | null; last_active: string };

export default async function AlunaRankingPage() {
  await getCurrentAdmin();
  const service = createServiceClient();

  const [
    { data: topByLessonsRpc },
    { data: topByCertsRpc },
    { data: topByEnrollsRpc },
    { data: recentlyActiveRpc },
    { count: totalProgress },
    { count: totalCompleted },
    { data: alunaComProgressoData },
    { data: alunaComCertificadoData },
    { data: paymentEvents },
    { data: enrollsAll },
    { data: allProfiles },
    { data: courses },
  ] = await Promise.all([
    // Rankings — agregados no Postgres (join + group by + order + limit)
    service.rpc("admin_top_students_by_lessons", { limit_n: 10 }),
    service.rpc("admin_top_students_by_certificates", { limit_n: 10 }),
    service.rpc("admin_top_students_by_enrollments", { limit_n: 10 }),
    service.rpc("admin_recently_active_students", { limit_n: 10 }),

    // Estatísticas de engajamento — contagens no Postgres
    service.from("lesson_progress").select("*", { count: "exact", head: true }),
    service.from("lesson_progress").select("*", { count: "exact", head: true }).eq("completed", true),
    service.rpc("admin_students_with_progress_count"),
    service.rpc("admin_students_with_certificate_count"),

    // Rankings financeiros — precisam de correspondência por e-mail entre
    // payment_events (Payt) e profiles, e fallback de preço de catálogo por
    // matrícula; mantido em JS por ora — ver nota abaixo.
    service.from("payment_events")
      .select("buyer_email, buyer_name, amount_paid")
      .eq("processed", true)
      .not("amount_paid", "is", null),
    service.from("enrollments").select("user_id, course_id, granted_at, source"),
    service.from("profiles").select("id, full_name, email, avatar_url, created_at").eq("role", "student").eq("banned", false),
    service.from("courses").select("id, title, price"),
  ]);

  const topByLessons = (topByLessonsRpc ?? []) as LessonRankRow[];
  const topByCerts = (topByCertsRpc ?? []) as CertRankRow[];
  const topByEnrolls = (topByEnrollsRpc ?? []) as EnrollRankRow[];
  const recentlyActive = (recentlyActiveRpc ?? []) as ActiveRankRow[];

  const profiles = (allProfiles ?? []) as Profile[];
  const coursePriceMap = new Map<string, { title: string; price: number | null }>(
    (courses ?? []).map((c) => [c.id, { title: c.title, price: c.price }])
  );

  // ── Novatas — já vem ordenado/filtrado do fetch de profiles acima ────────
  const newest = [...profiles]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  // ── Estatísticas de engajamento ───────────────────────────────────────────
  const engagementRate = totalProgress && totalProgress > 0
    ? Math.round(((totalCompleted ?? 0) / totalProgress) * 100)
    : 0;
  const alunaComCertificado = (alunaComCertificadoData as unknown as number) ?? 0;
  const alunaComProgresso = (alunaComProgressoData as unknown as number) ?? 0;

  // ── Rankings financeiros ─────────────────────────────────────────
  // NOTA: mantido em JS deliberadamente (não migrado para RPC nesta passada).
  // A lógica mistura valor real pago (payment_events.amount_paid, casado por
  // e-mail) com fallback do preço de catálogo por matrícula quando não há
  // amount_paid — reescrever essa mesclagem em SQL arriscaria alterar os
  // números financeiros exibidos sem cobertura de teste equivalente. Os
  // volumes envolvidos (alunas + eventos de pagamento) ainda são pequenos o
  // bastante para processar em memória sem impacto perceptível.
  const realSpentByEmail = new Map<string, number>(); // centavos
  const txCountByEmail = new Map<string, number>();
  for (const pe of paymentEvents ?? []) {
    if (!pe.buyer_email || !pe.amount_paid) continue;
    const email = pe.buyer_email.toLowerCase();
    realSpentByEmail.set(email, (realSpentByEmail.get(email) ?? 0) + pe.amount_paid);
    txCountByEmail.set(email, (txCountByEmail.get(email) ?? 0) + 1);
  }

  // Matrículas completas por usuária (para modal e fallback de preço)
  const enrollsByUserFull = new Map<string, CourseEnroll[]>();
  const spentByUser = new Map<string, number>(); // fallback: soma de course.price
  const buyCountByUser = new Map<string, number>();

  for (const e of enrollsAll ?? []) {
    const course = coursePriceMap.get(e.course_id);
    if (!course) continue;
    if (!enrollsByUserFull.has(e.user_id)) enrollsByUserFull.set(e.user_id, []);
    enrollsByUserFull.get(e.user_id)!.push({
      courseId: e.course_id,
      courseTitle: course.title,
      price: course.price,
      source: e.source ?? "manual",
      grantedAt: e.granted_at,
    });
    if (e.source === "payt" && course.price) {
      spentByUser.set(e.user_id, (spentByUser.get(e.user_id) ?? 0) + course.price);
      buyCountByUser.set(e.user_id, (buyCountByUser.get(e.user_id) ?? 0) + 1);
    }
  }

  // Mapa e-mail → perfil
  const profileByEmail = new Map(profiles.map((p) => [p.email.toLowerCase(), p]));

  // Gasto final por user_id: usa valor real (payment_events) se disponível, senão catálogo
  const finalSpentByUser = new Map<string, number>();
  for (const p of profiles) {
    const realCents = realSpentByEmail.get(p.email.toLowerCase());
    if (realCents != null) {
      finalSpentByUser.set(p.id, realCents / 100);
    } else if (spentByUser.has(p.id)) {
      finalSpentByUser.set(p.id, spentByUser.get(p.id)!);
    }
  }

  const toStudentRow = (id: string): StudentRow | null => {
    const p = profileByEmail.get(profiles.find((pr) => pr.id === id)?.email.toLowerCase() ?? "");
    const prof = profiles.find((pr) => pr.id === id);
    if (!prof) return null;
    return {
      id,
      name: prof.full_name ?? prof.email,
      email: prof.email,
      avatar: prof.avatar_url,
      totalSpent: finalSpentByUser.get(id) ?? 0,
      buyCount: txCountByEmail.get(prof.email.toLowerCase()) ?? buyCountByUser.get(id) ?? 0,
    };
  };

  const topBySpent: StudentRow[] = [...finalSpentByUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => toStudentRow(id))
    .filter((x): x is StudentRow => x !== null);

  const topByBuys: StudentRow[] = [...new Set([...txCountByEmail.keys(), ...[...buyCountByUser.keys()].map((id) => profiles.find((p) => p.id === id)?.email.toLowerCase() ?? "")])]
    .map((email) => {
      const prof = profileByEmail.get(email);
      if (!prof) return null;
      const count = txCountByEmail.get(email) ?? buyCountByUser.get(prof.id) ?? 0;
      return { id: prof.id, name: prof.full_name ?? prof.email, email: prof.email, avatar: prof.avatar_url, totalSpent: finalSpentByUser.get(prof.id) ?? 0, buyCount: count };
    })
    .filter((x): x is StudentRow => x !== null)
    .sort((a, b) => b.buyCount - a.buyCount)
    .slice(0, 10);

  // Apenas dados dos usuários relevantes para o modal (mantém prop pequena)
  const relevantIds = new Set([...topBySpent.map((s) => s.id), ...topByBuys.map((s) => s.id)]);
  const enrollmentsByUserId: Record<string, CourseEnroll[]> = {};
  for (const id of relevantIds) {
    enrollmentsByUserId[id] = enrollsByUserFull.get(id) ?? [];
  }

  return (
    <div className="space-y-8">
      {/* Cards de engajamento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserCheck} label="Alunas com progresso" value={alunaComProgresso} color="#f6614f"
          tooltip="Alunas que iniciaram pelo menos uma aula — têm algum registro de progresso na plataforma." />
        <StatCard icon={BookOpen} label="Aulas concluídas total" value={totalCompleted ?? 0} color="#71c69a"
          tooltip="Soma de todas as aulas marcadas como concluídas em toda a plataforma (pelo botão explícito ou ao atingir 90% do vídeo)." />
        <StatCard icon={Award} label="Com certificados" value={alunaComCertificado} color="#eebc3e"
          tooltip="Número de alunas que receberam pelo menos um certificado de conclusão de curso." />
        <StatCard icon={Activity} label="Taxa de engajamento" value={`${engagementRate}%`} color="#f6614f"
          tooltip="Proporção de aulas concluídas em relação ao total de aulas iniciadas (concluídas ÷ total com progresso × 100)." />
      </div>

      {/* Rankings financeiros (Client Component — modal interativo) */}
      <FinancialRankings
        topBySpent={topBySpent}
        topByBuys={topByBuys}
        enrollmentsByUserId={enrollmentsByUserId}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top por aulas concluídas */}
        <RankingCard
          title="Mais dedicadas"
          subtitle="por aulas concluídas"
          icon={BookOpen}
          color="#f6614f"
          items={topByLessons.map((r) => ({
            id: r.user_id,
            name: r.full_name ?? r.email,
            email: r.email,
            avatar: r.avatar_url,
            value: `${r.lesson_count} aulas`,
            badge: r.lesson_count,
          }))}
        />

        {/* Top por certificados */}
        <RankingCard
          title="Mais certificadas"
          subtitle="por cursos concluídos"
          icon={Award}
          color="#71c69a"
          items={topByCerts.map((r) => ({
            id: r.user_id,
            name: r.full_name ?? r.email,
            email: r.email,
            avatar: r.avatar_url,
            value: `${r.certificate_count} cert.`,
            badge: r.certificate_count,
          }))}
        />

        {/* Top por matrículas */}
        <RankingCard
          title="Mais matrículas"
          subtitle="por cursos adquiridos"
          icon={Trophy}
          color="#eebc3e"
          items={topByEnrolls.map((r) => ({
            id: r.user_id,
            name: r.full_name ?? r.email,
            email: r.email,
            avatar: r.avatar_url,
            value: `${r.enrollment_count} cursos`,
            badge: r.enrollment_count,
          }))}
        />

        {/* Últimas ativas */}
        <RankingCard
          title="Últimas ativas"
          subtitle="mais recentes na plataforma"
          icon={Clock}
          color="#f6614f"
          items={recentlyActive.map((r) => ({
            id: r.user_id,
            name: r.full_name ?? r.email,
            email: r.email,
            avatar: r.avatar_url,
            value: formatRelativeTime(r.last_active),
            badge: null,
          }))}
        />
      </div>

      {/* Novatas */}
      <div className="lumii-card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-lumii-green" />
          Novatas recentes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {newest.map((p) => (
            <StudentMiniModal
              key={p.id}
              student={{ id: p.id, name: p.full_name, email: p.email, avatar: p.avatar_url, createdAt: p.created_at }}
              className="block"
            >
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors">
                <Avatar name={p.full_name ?? p.email} url={p.avatar_url} size={32} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{p.full_name ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </StudentMiniModal>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Componentes ────────────────────────────────────────────────────

function Avatar({ name, url, size = 36 }: { name: string; url: string | null; size?: number }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 text-white font-semibold"
      style={{ width: size, height: size, background: "#f6614f", fontSize: size * 0.35 }}
    >
      {initials || "?"}
    </div>
  );
}

function RankingCard({
  title, subtitle, icon: Icon, color, items,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  items: Array<{ id: string; name: string; email: string; avatar: string | null; value: string; badge: number | null }>;
}) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="lumii-card p-6">
      <h2 className="font-semibold mb-0.5 flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color }} />
        {title}
      </h2>
      <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum dado ainda.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map(({ id, name, email, avatar, value }, i) => (
            <StudentMiniModal key={id} student={{ id, name, email, avatar }} className="block">
              <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 rounded-xl px-2 -mx-2 py-1 transition-colors">
                <span className="text-base w-6 shrink-0 text-center">
                  {medals[i] ?? <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>}
                </span>
                <Avatar name={name} url={avatar} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                  style={{ background: color + "20", color }}
                >
                  {value}
                </span>
              </div>
            </StudentMiniModal>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, tooltip }: {
  icon: React.ElementType; label: string; value: number | string; color: string; tooltip?: string;
}) {
  return (
    <div className="lumii-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "20" }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs text-muted-foreground font-medium flex-1">{label}</span>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
