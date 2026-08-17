import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { unstable_cache } from "next/cache";
import { formatPrice, formatDuration } from "@/lib/format";
import CursosGrid from "./cursos-grid";
import BannerDisplay from "@/components/banner/BannerDisplay";

export const revalidate = 60;

// A página inteira é dinâmica (usa searchParams + getUser()), então o
// `revalidate` acima nunca se aplicava de fato — o catálogo (categorias,
// vitrine, cursos+módulos+aulas publicados) refazia a mesma consulta a
// cada request, logada ou não. Isolado aqui num unstable_cache com tag
// "catalog": invalidado nas Server Actions que editam curso/módulo/aula/
// vitrine/categoria (revalidateTag("catalog")), com os 60s como rede de
// segurança. Não cobre o caso "admin vê rascunhos" nem "aluna vê curso que
// comprou mas não está na vitrine" — esses dois casos continuam com busca
// dinâmica separada, fora do cache.
const getCachedCatalog = unstable_cache(
  async () => {
    const service = createServiceClient();
    const [{ data: categoriesRaw }, { data: showcaseRaw }] = await Promise.all([
      service.from("categories").select("id, name, slug").order("name"),
      service.from("showcase_courses").select("course_id, sales_video_panda_id").eq("active", true),
    ]);

    const showcaseIds = ((showcaseRaw ?? []) as { course_id: string }[]).map((s) => s.course_id);

    const { data: coursesRaw } =
      showcaseIds.length > 0
        ? await service
            .from("courses")
            .select(
              `
              id, slug, title, description, thumbnail_url,
              price, workload_hours, checkout_url, course_type,
              category:categories(id, name, slug),
              modules(
                id, title, position, archived,
                lessons(id, title, duration_seconds, is_preview, position, archived)
              )
            `
            )
            .eq("published", true)
            .in("id", showcaseIds)
            .order("position")
        : { data: [] };

    return { categoriesRaw, showcaseRaw, coursesRaw };
  },
  ["catalog"],
  { revalidate: 60, tags: ["catalog"] }
);

export type CatalogLesson = {
  id: string;
  title: string;
  duration_seconds: number;
  is_preview: boolean;
  position: number;
};

export type CatalogModule = {
  id: string;
  title: string;
  position: number;
  lessons: CatalogLesson[];
};

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number | null;
  priceFormatted: string;
  workload_hours: number;
  checkout_url: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  course_type: "course" | "material";
  hasPreview: boolean;
  sales_video_panda_id: string | null;
  modules: CatalogModule[];
  totalLessons: number;
  // dados de matrícula (preenchidos se logada)
  isEnrolled: boolean;
  progress: { completed: number; total: number; percentage: number } | null;
  lastLessonId: string | null;
  firstLessonId: string | null;
};

export type CatalogCategory = { id: string; name: string; slug: string };

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const supabase = await createClient();
  const service = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin tem acesso irrestrito a todos os cursos (inclusive rascunhos), consistente com Minha Jornada
  const isAdmin = user
    ? (await supabase.from("profiles").select("role").eq("id", user.id).single()).data?.role === "admin"
    : false;

  const now = new Date().toISOString();
  const enrollmentResult = user
    ? await supabase.from("enrollments").select("course_id").eq("user_id", user.id).or(`expires_at.is.null,expires_at.gt.${now}`)
    : { data: null };
  const enrolledIdsList = ((enrollmentResult?.data ?? []) as { course_id: string }[]).map((e) => e.course_id);

  let categoriesRaw: { id: string; name: string; slug: string }[] | null;
  let showcaseRaw: { course_id: string; sales_video_panda_id: string | null }[] | null;
  let coursesRaw: unknown[] | null;

  const courseSelectClause = `
    id, slug, title, description, thumbnail_url,
    price, workload_hours, checkout_url, course_type,
    category:categories(id, name, slug),
    modules(
      id, title, position, archived,
      lessons(id, title, duration_seconds, is_preview, position, archived)
    )
  `;

  if (isAdmin) {
    // Admin vê tudo (inclusive rascunhos) — sempre dinâmico, nunca cacheado.
    const [catRes, showcaseRes, coursesRes] = await Promise.all([
      service.from("categories").select("id, name, slug").order("name"),
      service.from("showcase_courses").select("course_id, sales_video_panda_id").eq("active", true),
      service.from("courses").select(courseSelectClause).order("position"),
    ]);
    categoriesRaw = catRes.data;
    showcaseRaw = showcaseRes.data;
    coursesRaw = coursesRes.data;
  } else {
    const cached = await getCachedCatalog();
    categoriesRaw = cached.categoriesRaw;
    showcaseRaw = cached.showcaseRaw;
    coursesRaw = cached.coursesRaw;

    // Caso raro: aluna comprou um curso que não está (ou não está mais) na
    // vitrine — busca só esses, fora do cache, e junta com o resultado cacheado.
    const showcaseIds = new Set((showcaseRaw ?? []).map((s) => s.course_id));
    const extraEnrolledIds = enrolledIdsList.filter((id) => !showcaseIds.has(id));
    if (extraEnrolledIds.length > 0) {
      const { data: extraCourses } = await service
        .from("courses")
        .select(courseSelectClause)
        .eq("published", true)
        .in("id", extraEnrolledIds);
      coursesRaw = [...(coursesRaw ?? []), ...(extraCourses ?? [])];
    }
  }

  const categories: CatalogCategory[] = (categoriesRaw ?? []) as CatalogCategory[];
  const showcaseMap = Object.fromEntries(
    (showcaseRaw ?? []).map((s) => [s.course_id, s.sales_video_panda_id])
  );

  type RawLesson = {
    id: string;
    title: string;
    duration_seconds: number;
    is_preview: boolean;
    position: number;
    archived: boolean;
  };
  type RawModule = {
    id: string;
    title: string;
    position: number;
    archived: boolean;
    lessons: RawLesson[] | null;
  };
  type RawCourse = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    price: number | null;
    workload_hours: number;
    checkout_url: string | null;
    course_type: "course" | "material";
    category: { id: string; name: string; slug: string } | null;
    modules: RawModule[] | null;
  };

  // Normaliza cursos (filtra arquivados, ordena)
  const courses: CatalogCourse[] = ((coursesRaw ?? []) as unknown as RawCourse[]).map((c) => {
    const mods = ((c.modules ?? []) as RawModule[])
      .filter((m) => !m.archived)
      .map((m) => ({
        id: m.id,
        title: m.title,
        position: m.position,
        lessons: ((m.lessons ?? []) as RawLesson[])
          .filter((l) => !l.archived)
          .sort((a, b) => a.position - b.position),
      }))
      .sort((a, b) => a.position - b.position);

    const allLessons = mods.flatMap((m) => m.lessons);
    const hasPreview = allLessons.some((l) => l.is_preview);
    const totalLessons = allLessons.length;
    const firstLessonId = mods[0]?.lessons[0]?.id ?? null;

    const cat = c.category as { id: string; name: string; slug: string } | null;

    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      thumbnail_url: c.thumbnail_url,
      price: c.price,
      priceFormatted: formatPrice(c.price ?? 0),
      workload_hours: c.workload_hours,
      checkout_url: c.checkout_url,
      categoryName: cat?.name ?? null,
      categorySlug: cat?.slug ?? null,
      course_type: c.course_type ?? "course",
      hasPreview,
      sales_video_panda_id: showcaseMap[c.id] ?? null,
      modules: mods,
      totalLessons,
      isEnrolled: false,
      progress: null,
      lastLessonId: null,
      firstLessonId,
    };
  });

  // Dados de matrícula e progresso (somente se logada)
  if (user) {
    // Admin vê todos os cursos como liberados, mesmo sem matrícula real
    const enrolledIds = isAdmin ? new Set(courses.map((c) => c.id)) : new Set(enrolledIdsList);

    if (enrolledIds.size > 0) {
      const enrolledCourses = courses.filter((c) => enrolledIds.has(c.id));
      const enrolledLessonIds = enrolledCourses.flatMap((c) =>
        c.modules.flatMap((m) => m.lessons.map((l) => l.id))
      );

      const progressMap: Record<string, { completed: number; total: number; percentage: number }> =
        {};
      const lastLessonMap: Record<string, string> = {};

      if (enrolledLessonIds.length > 0) {
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("lesson_id, completed, updated_at")
          .eq("user_id", user.id)
          .in("lesson_id", enrolledLessonIds)
          .order("updated_at", { ascending: false });

        const progressRows = (progressData ?? []) as {
          lesson_id: string;
          completed: boolean;
          updated_at: string;
        }[];

        // lesson_id → course_id para lookup
        const lessonToCourse: Record<string, string> = {};
        for (const c of enrolledCourses) {
          for (const m of c.modules) {
            for (const l of m.lessons) {
              lessonToCourse[l.id] = c.id;
            }
          }
        }

        const completedSet = new Set(progressRows.filter((p) => p.completed).map((p) => p.lesson_id));

        for (const p of progressRows) {
          const cid = lessonToCourse[p.lesson_id];
          if (cid && !lastLessonMap[cid]) {
            lastLessonMap[cid] = p.lesson_id;
          }
        }

        for (const c of enrolledCourses) {
          const total = c.totalLessons;
          const completed = c.modules
            .flatMap((m) => m.lessons)
            .filter((l) => completedSet.has(l.id)).length;
          progressMap[c.id] = {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        }
      } else {
        for (const c of enrolledCourses) {
          progressMap[c.id] = { completed: 0, total: c.totalLessons, percentage: 0 };
        }
      }

      // Aplica dados de matrícula nos cursos
      for (const c of courses) {
        if (enrolledIds.has(c.id)) {
          c.isEnrolled = true;
          c.progress = progressMap[c.id] ?? { completed: 0, total: c.totalLessons, percentage: 0 };
          c.lastLessonId = lastLessonMap[c.id] ?? null;
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-lumii-bg">
      {/* Hero */}
      <div className="bg-white border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center">
          <p className="text-sm font-medium text-[#f6614f] uppercase tracking-wide mb-3">
            Plataforma de Educação Infantil para Pais e Professores
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0F0F0F]">
            Cursos que <span className="accent-word">iluminam</span> sua jornada com a infância
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Cuidar de quem cuida da infância.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <CursosGrid
          courses={courses}
          categories={categories}
          isLoggedIn={!!user}
          headerBanner={<BannerDisplay slot="header" />}
          tipo={tipo}
        />
      </div>
    </div>
  );
}
