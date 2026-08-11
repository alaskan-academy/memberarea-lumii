import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import NewPlanFlow from "@/components/ferramentas/support-plan/NewPlanFlow";

export default async function NovoPlanoPage({
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

  return <NewPlanFlow studentId={student.id} studentName={student.name} />;
}
