import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import StudentFichaClient from "@/components/ferramentas/diario/StudentFichaClient";
import { fetchPlansForTarget } from "@/lib/ferramentas/support-plan/queries";
import { fetchLogsForStudent } from "@/lib/ferramentas/diario/queries";
import { fetchGoalsForStudent } from "@/lib/ferramentas/metas/queries";
import { fetchScoresForStudent } from "@/lib/ferramentas/planejamento/rubricas/queries";
import { getTier } from "@/lib/access/getTier";
import { tierAtLeast } from "@/lib/access/tier";
import type { StudentRubricScore } from "@/lib/ferramentas/planejamento/rubricas/types";

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { studentId } = await params;
  const { aba } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Confirma que o aluno é deste professor (o RLS já garante, isto dá 404 amigável).
  const { data: student } = await supabase
    .from("teacher_students")
    .select("id, name")
    .eq("id", studentId)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!student) notFound();

  const [plans, logs, goals, tier] = await Promise.all([
    fetchPlansForTarget(supabase, "student_id", studentId),
    fetchLogsForStudent(supabase, studentId),
    fetchGoalsForStudent(supabase, studentId),
    getTier(user.id),
  ]);

  // Relatório é do Lumii Completo — só busca a matéria-prima extra (avaliações)
  // para quem tem acesso; para os demais a aba mostra o teaser, sem query.
  const reportScores: StudentRubricScore[] = tierAtLeast(tier, "completo")
    ? await fetchScoresForStudent(supabase, user.id, studentId)
    : [];

  const initialTab =
    aba === "plano" ? "plano" : aba === "metas" ? "metas" : aba === "relatorio" ? "relatorio" : "diario";

  return (
    <StudentFichaClient
      student={{ id: student.id, name: student.name }}
      plans={plans}
      logs={logs}
      goals={goals}
      tier={tier}
      reportScores={reportScores}
      initialTab={initialTab}
    />
  );
}
