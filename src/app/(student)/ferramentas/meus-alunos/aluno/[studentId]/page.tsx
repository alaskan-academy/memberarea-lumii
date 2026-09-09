import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import StudentFichaClient from "@/components/ferramentas/diario/StudentFichaClient";
import { fetchPlansForTarget } from "@/lib/ferramentas/support-plan/queries";
import { fetchLogsForStudent } from "@/lib/ferramentas/diario/queries";

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

  const [plans, logs] = await Promise.all([
    fetchPlansForTarget(supabase, "student_id", studentId),
    fetchLogsForStudent(supabase, studentId),
  ]);

  return (
    <StudentFichaClient
      student={{ id: student.id, name: student.name }}
      plans={plans}
      logs={logs}
      initialTab={aba === "plano" ? "plano" : "diario"}
    />
  );
}
