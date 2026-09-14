import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendReengagementEmail, type ReengagementCourse } from "@/lib/email";

// Vercel Cron: roda SEMANALMENTE — quinta às 21h30 BRT (= sexta 00h30 UTC).
// vercel.json crons: [{ "path": "/api/cron/reengagement", "schedule": "30 0 * * 5" }]
//
// Trava de reengajamento (para não virar spam diário):
// - no máximo 4 e-mails na VIDA da aluna: reengajamento-1 .. reengajamento-4
// - intervalo mínimo entre eles (a cadência real vem do cron semanal)
// - cada envio é registrado em `email_campaign_sends`
//
// Envia no máximo 1 e-mail por aluna por execução, mesmo com vários cursos
// parados. Todo o cruzamento (matrícula→módulo→aula→progresso→histórico) é
// feito em lote (poucas queries com .in(), nunca uma por aluna) e processado
// em memória — sem N+1 quando a base cresce.

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const service = createServiceClient();
    const now = new Date().toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Matrículas ativas
    const { data: enrollments } = await service
      .from("enrollments")
      .select("user_id, course_id")
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (!enrollments?.length) return NextResponse.json({ sent: 0 });

    const courseIds = [...new Set(enrollments.map((e) => e.course_id))];
    const userIds = [...new Set(enrollments.map((e) => e.user_id))];

    // ── Fase 1: busca em lote — módulos, aulas, cursos e progresso ──────────
    const { data: modules } = await service
      .from("modules")
      .select("id, course_id")
      .in("course_id", courseIds);

    const moduleToCourse: Record<string, string> = {};
    for (const m of modules ?? []) moduleToCourse[m.id] = m.course_id;
    const moduleIds = Object.keys(moduleToCourse);

    const { data: lessons } = moduleIds.length
      ? await service.from("lessons").select("id, module_id").in("module_id", moduleIds)
      : { data: [] };

    // Agrupa lesson_ids por curso
    const lessonsByCourse: Record<string, string[]> = {};
    for (const l of lessons ?? []) {
      const courseId = moduleToCourse[l.module_id];
      if (!courseId) continue;
      (lessonsByCourse[courseId] ??= []).push(l.id);
    }

    const allLessonIds = (lessons ?? []).map((l) => l.id);

    const { data: progress } = allLessonIds.length
      ? await service
          .from("lesson_progress")
          .select("user_id, lesson_id, completed, updated_at")
          .in("user_id", userIds)
          .in("lesson_id", allLessonIds)
      : { data: [] };

    // Agrupa progresso por usuária
    const progressByUser: Record<
      string,
      { lesson_id: string; completed: boolean; updated_at: string }[]
    > = {};
    for (const p of progress ?? []) {
      (progressByUser[p.user_id] ??= []).push(p);
    }

    const { data: courses } = await service
      .from("courses")
      .select("id, title, slug")
      .in("id", courseIds);
    const courseById: Record<string, { title: string; slug: string }> = {};
    for (const c of courses ?? []) courseById[c.id] = { title: c.title, slug: c.slug };

    // ── Fase 2: acumula cursos elegíveis por aluna (tudo em memória) ────────
    const byUser = new Map<string, ReengagementCourse[]>();

    for (const { user_id, course_id } of enrollments) {
      const lessonIds = lessonsByCourse[course_id];
      if (!lessonIds?.length) continue;

      const lessonIdSet = new Set(lessonIds);
      const userProgress = (progressByUser[user_id] ?? []).filter((p) => lessonIdSet.has(p.lesson_id));
      if (!userProgress.length) continue; // nunca acessou

      // Verificar se acessou nos últimos 7 dias
      const recentAccess = userProgress.some((p) => p.updated_at >= sevenDaysAgo);
      if (recentAccess) continue;

      // Verificar se já concluiu
      const completedCount = userProgress.filter((p) => p.completed).length;
      const pct = (completedCount / lessonIds.length) * 100;
      if (pct >= 100) continue;

      const course = courseById[course_id];
      if (!course) continue;

      const list = byUser.get(user_id) ?? [];
      list.push({ title: course.title, slug: course.slug, progressPercent: pct });
      byUser.set(user_id, list);
    }

    if (byUser.size === 0) return NextResponse.json({ sent: 0 });

    // ── Fase 3: aplica a trava, envia 1 e-mail por aluna e registra ────────
    const candidateIds = [...byUser.keys()];

    const MAX_LIFETIME = 4; // no máximo 4 e-mails de reengajamento na vida da aluna
    // A cadência real (≈7 dias) vem do cron semanal; esta guarda de 6 dias tolera
    // o jitter do agendador e bloqueia reenvio na mesma semana (ex.: re-run manual).
    const MIN_GAP_DAYS = 6;
    const gapCutoffMs = Date.now() - MIN_GAP_DAYS * 24 * 60 * 60 * 1000;

    // UMA leitura em lote do histórico de reengajamento de todas as candidatas
    // (nunca uma consulta por aluna).
    const { data: priorSends } = candidateIds.length
      ? await service
          .from("email_campaign_sends")
          .select("user_id, sent_at")
          .in("user_id", candidateIds)
          .like("campaign", "reengajamento-%")
      : { data: [] };

    // Quantos já recebeu e quando foi o último — agrupado em memória.
    const histByUser = new Map<string, { count: number; last: string }>();
    for (const s of priorSends ?? []) {
      const cur = histByUser.get(s.user_id) ?? { count: 0, last: "" };
      cur.count += 1;
      if (s.sent_at > cur.last) cur.last = s.sent_at;
      histByUser.set(s.user_id, cur);
    }

    const { data: profiles } = await service
      .from("profiles")
      .select("id, full_name, email, email_prefs")
      .in("id", candidateIds);

    let sent = 0;
    const novosRegistros: { user_id: string; campaign: string }[] = [];

    for (const profile of profiles ?? []) {
      if (!profile.email) continue;
      const prefs = profile.email_prefs as Record<string, boolean> | null;
      if (prefs?.reengagement === false) continue;

      const courses = byUser.get(profile.id);
      if (!courses?.length) continue;

      const hist = histByUser.get(profile.id);
      const jaEnviados = hist?.count ?? 0;
      if (jaEnviados >= MAX_LIFETIME) continue; // teto de 4 na vida
      // respeita o intervalo mínimo (compara por timestamp, não por string ISO)
      if (hist && new Date(hist.last).getTime() > gapCutoffMs) continue;

      const result = await sendReengagementEmail({
        to: profile.email,
        studentName: profile.full_name ?? "Aluna",
        courses,
      });

      if (!result.success) {
        console.error(`[cron/reengagement] falha ao enviar para ${profile.email}: ${result.error}`);
        continue;
      }

      novosRegistros.push({ user_id: profile.id, campaign: `reengajamento-${jaEnviados + 1}` });
      sent++;
    }

    // UMA escrita em lote registrando todos os envios desta execução (a trava
    // da próxima semana lê isto).
    if (novosRegistros.length) {
      const { error: registroError } = await service
        .from("email_campaign_sends")
        .insert(novosRegistros);
      if (registroError) {
        console.error("[cron/reengagement] falha ao registrar envios:", registroError.message);
      }
    }

    console.info(`[cron/reengagement] ${sent} e-mails enviados (${byUser.size} alunas elegíveis)`);
    return NextResponse.json({ sent });
  } catch (e) {
    console.error("[cron/reengagement]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
