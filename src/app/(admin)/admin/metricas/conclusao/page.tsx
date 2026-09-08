import { createServiceClient } from "@/lib/supabase/service";
import { fetchAll } from "@/lib/supabase/fetch-all";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Award, BookOpen, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { assertAdminPage } from "@/lib/supabase/admin-guard";

export default async function TaxaConclusaoPage() {
  await assertAdminPage();
  const service = createServiceClient();

  const now = new Date().toISOString();

  // Paginado (fetchAll): enrollments/certificates/profiles passam de 1.000 linhas.
  const [enrollsAll, certs, profiles, courses] = await Promise.all([
    fetchAll((from, to) =>
      service
        .from("enrollments")
        .select("user_id, course_id, granted_at")
        .or(`expires_at.is.null,expires_at.gte.${now}`)
        .order("id")
        .range(from, to)),
    fetchAll((from, to) =>
      service.from("certificates").select("user_id, course_id, issued_at").order("id").range(from, to)),
    fetchAll((from, to) =>
      service.from("profiles").select("id, full_name, email, avatar_url").eq("role", "student").eq("banned", false).order("id").range(from, to)),
    fetchAll((from, to) =>
      service.from("courses").select("id, title").order("id").range(from, to)),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));

  // Alunas com ≥1 certificado (concluíram pelo menos um curso)
  const certsByUser = new Map<string, { courseId: string; issuedAt: string }[]>();
  for (const c of certs ?? []) {
    if (!certsByUser.has(c.user_id)) certsByUser.set(c.user_id, []);
    certsByUser.get(c.user_id)!.push({ courseId: c.course_id, issuedAt: c.issued_at });
  }

  // Alunas matriculadas sem nenhum certificado (em andamento)
  const enrolledUserIds = new Set((enrollsAll ?? []).map((e) => e.user_id));
  const certUserIds = new Set(certsByUser.keys());

  // Quem concluiu: tem certificado E tem matrícula ativa
  const concluded = [...certUserIds]
    .filter((id) => enrolledUserIds.has(id))
    .map((id) => ({
      profile: profileMap.get(id),
      certs: certsByUser.get(id)!,
    }))
    .filter((r) => r.profile)
    .sort((a, b) => {
      const latestA = Math.max(...a.certs.map((c) => new Date(c.issuedAt).getTime()));
      const latestB = Math.max(...b.certs.map((c) => new Date(c.issuedAt).getTime()));
      return latestB - latestA;
    });

  // Em andamento: matriculada mas sem nenhum certificado
  const inProgress = [...enrolledUserIds]
    .filter((id) => !certUserIds.has(id))
    .map((id) => {
      const userEnrolls = (enrollsAll ?? []).filter((e) => e.user_id === id);
      return {
        profile: profileMap.get(id),
        enrollCount: userEnrolls.length,
        lastEnroll: userEnrolls.map((e) => e.granted_at).sort().at(-1) ?? "",
      };
    })
    .filter((r) => r.profile)
    .sort((a, b) => b.enrollCount - a.enrollCount);

  const totalMatriculas = enrolledUserIds.size;
  const taxa = totalMatriculas > 0 ? Math.round((concluded.length / totalMatriculas) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/metricas"
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-lumii-coral" />
            Taxa de conclusão
          </h2>
          <p className="text-sm text-muted-foreground">
            Alunas que concluíram vs. em andamento
          </p>
        </div>
      </div>

      {/* Barra de progresso geral */}
      <div className="lumii-card p-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-4xl font-bold text-lumii-coral">{taxa}%</p>
            <p className="text-sm text-muted-foreground mt-1">
              {concluded.length} de {totalMatriculas} alunas concluíram pelo menos um curso
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground space-y-1">
            <p className="flex items-center gap-1.5 justify-end">
              <CheckCircle2 className="w-3.5 h-3.5 text-lumii-green" />
              {concluded.length} concluíram
            </p>
            <p className="flex items-center gap-1.5 justify-end">
              <Clock className="w-3.5 h-3.5 text-lumii-yellow" />
              {inProgress.length} em andamento
            </p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-lumii-coral transition-all"
            style={{ width: `${taxa}%` }}
          />
        </div>
      </div>

      {/* Split em duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Concluíram */}
        <div className="lumii-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Award className="w-4 h-4 text-lumii-green" />
            <span className="font-semibold text-sm">Concluíram</span>
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-lumii-green/15 text-lumii-green-dark">
              {concluded.length}
            </span>
          </div>
          {concluded.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              Nenhuma aluna concluiu um curso ainda.
            </div>
          ) : (
            <div className="divide-y divide-border/40 max-h-[480px] overflow-y-auto">
              {concluded.map(({ profile, certs: userCerts }) => (
                <div key={profile!.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                  <StudentAvatar name={profile!.full_name ?? profile!.email} url={profile!.avatar_url} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile!.full_name ?? profile!.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile!.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-lumii-green">
                      {userCerts.length} cert.
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(
                        Math.max(...userCerts.map((c) => new Date(c.issuedAt).getTime()))
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Em andamento */}
        <div className="lumii-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-lumii-yellow" />
            <span className="font-semibold text-sm">Em andamento</span>
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-lumii-yellow/15 text-amber-700">
              {inProgress.length}
            </span>
          </div>
          {inProgress.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              Todas as alunas já concluíram pelo menos um curso.
            </div>
          ) : (
            <div className="divide-y divide-border/40 max-h-[480px] overflow-y-auto">
              {inProgress.map(({ profile, enrollCount }) => (
                <div key={profile!.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                  <StudentAvatar name={profile!.full_name ?? profile!.email} url={profile!.avatar_url} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile!.full_name ?? profile!.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile!.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-lumii-yellow">
                      {enrollCount} curso{enrollCount !== 1 ? "s" : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground">sem cert.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentAvatar({ name, url, size = 36 }: { name: string; url: string | null; size?: number }) {
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
      className="rounded-full flex items-center justify-center shrink-0 font-semibold"
      style={{ width: size, height: size, background: "#f6614f", fontSize: size * 0.35, color: "#fff" }}
    >
      {initials || "?"}
    </div>
  );
}
