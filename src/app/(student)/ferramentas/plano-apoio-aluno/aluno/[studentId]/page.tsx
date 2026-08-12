import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PlanTargetDetailClient from "@/components/ferramentas/support-plan/PlanTargetDetailClient";
import { fetchPlansForTarget } from "@/lib/ferramentas/support-plan/queries";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase
    .from("teacher_students")
    .select("id, name")
    .eq("id", studentId)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!student) notFound();

  const plans = await fetchPlansForTarget(supabase, "student_id", studentId);

  return (
    <PlanTargetDetailClient
      target={{ kind: "aluno", id: student.id, name: student.name }}
      plans={plans}
    />
  );
}
