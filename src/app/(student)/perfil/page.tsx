import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserPushEndpoints } from "@/lib/push/actions";
import PerfilView, {
  type Profile,
  type Certificate,
  type CourseCard,
} from "./perfil-view";

export const metadata: Metadata = { title: "Meu Perfil — Lumii" };

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, certRes, pushEndpoints] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, bio, avatar_url, email_prefs, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("certificates")
      .select("id, issued_at, verify_hash, course:courses(title, workload_hours)")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false }),
    getUserPushEndpoints(),
  ]);

  const profile = profileRes.data as Profile | null;
  const isAdmin = (profileRes.data as { role?: string | null } | null)?.role === "admin";
  const certificates = (certRes.data ?? []) as unknown as Certificate[];

  // Calcula progresso por curso
  type RawCourse = {
    id: string;
    slug: string;
    title: string;
    thumbnail_url: string | null;
    workload_hours: number;
  };

  // Admin tem acesso irrestrito a todos os cursos (mesma lógica do dashboard),
  // então não tem matrícula — busca todos os cursos publicados em vez de enrollments.
  let rawCourses: RawCourse[];
  if (isAdmin) {
    const { data: allCourses } = await supabase
      .from("courses")
      .select("id, slug, title, thumbnail_url, workload_hours")
      .order("position");
    rawCourses = (allCourses as RawCourse[] | null) ?? [];
  } else {
    const { data: enrollData } = await supabase
      .from("enrollments")
      .select("course:courses(id, slug, title, thumbnail_url, workload_hours)")
      .eq("user_id", user.id)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("granted_at", { ascending: false });
    rawCourses = ((enrollData ?? []) as unknown as { course: RawCourse | null }[])
      .map((e) => e.course)
      .filter(Boolean) as RawCourse[];
  }

  let courses: CourseCard[] = [];

  if (rawCourses.length) {
    const courseIds = rawCourses.map((c) => c.id);

    const { data: modules } = await supabase
      .from("modules")
      .select("course_id, lessons(id, archived)")
      .eq("archived", false)
      .in("course_id", courseIds);

    type LessonRef = { id: string; archived: boolean };
    type ModRow = { course_id: string; lessons: LessonRef[] };
    const mods = (modules as ModRow[] | null) ?? [];

    const allLessonIds = mods.flatMap((m) =>
      (m.lessons ?? []).filter((l) => !l.archived).map((l) => l.id)
    );

    const lessonToCourse: Record<string, string> = {};
    for (const m of mods) {
      for (const l of m.lessons ?? []) lessonToCourse[l.id] = m.course_id;
    }

    const totalsMap: Record<string, number> = {};
    for (const m of mods) {
      totalsMap[m.course_id] = (totalsMap[m.course_id] ?? 0) + (m.lessons ?? []).filter((l) => !l.archived).length;
    }

    const completedMap: Record<string, number> = {};
    const lastLessonMap: Record<string, string> = {};

    if (allLessonIds.length) {
      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed, updated_at")
        .eq("user_id", user.id)
        .in("lesson_id", allLessonIds)
        .order("updated_at", { ascending: false });

      for (const p of progress ?? []) {
        const cid = lessonToCourse[p.lesson_id];
        if (!cid) continue;
        if (p.completed) completedMap[cid] = (completedMap[cid] ?? 0) + 1;
        if (!lastLessonMap[cid]) lastLessonMap[cid] = p.lesson_id;
      }
    }

    courses = rawCourses.map((c) => {
      const total = totalsMap[c.id] ?? 0;
      const completed = completedMap[c.id] ?? 0;
      return {
        ...c,
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        lastLessonId: lastLessonMap[c.id] ?? null,
      };
    });
  }

  return (
    <PerfilView
      initialProfile={profile}
      initialCertificates={certificates}
      initialCourses={courses}
      initialPushEndpoints={pushEndpoints}
    />
  );
}
