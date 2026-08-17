import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendReengagementEmail, type ReengagementCourse } from "@/lib/email";

// Vercel Cron: roda diariamente às 10h BRT (13h UTC)
// vercel.json crons: [{ "path": "/api/cron/reengagement", "schedule": "0 13 * * *" }]
//
// Envia no máximo 1 e-mail por aluna por execução, mesmo que ela tenha
// vários cursos parados. Todo o cruzamento matrícula→módulo→aula→progresso
// é feito em lote (poucas queries com .in(), nunca uma por matrícula) e
// depois processado em memória — evita N+1 quando a base de matrículas cresce.

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

    // ── Fase 3: busca perfis em lote e envia um único e-mail por aluna ─────
    const { data: profiles } = await service
      .from("profiles")
      .select("id, full_name, email, email_prefs")
      .in("id", [...byUser.keys()]);

    let sent = 0;

    for (const profile of profiles ?? []) {
      if (!profile.email) continue;
      const prefs = profile.email_prefs as Record<string, boolean> | null;
      if (prefs?.reengagement === false) continue;

      const courses = byUser.get(profile.id);
      if (!courses?.length) continue;

      const result = await sendReengagementEmail({
        to: profile.email,
        studentName: profile.full_name ?? "Aluna",
        courses,
      });

      if (!result.success) {
        console.error(`[cron/reengagement] falha ao enviar para ${profile.email}: ${result.error}`);
        continue;
      }

      sent++;
    }

    console.info(`[cron/reengagement] ${sent} e-mails enviados (${byUser.size} alunas elegíveis)`);
    return NextResponse.json({ sent });
  } catch (e) {
    console.error("[cron/reengagement]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
