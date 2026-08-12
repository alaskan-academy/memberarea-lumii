import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PlanTargetDetailClient from "@/components/ferramentas/support-plan/PlanTargetDetailClient";
import { fetchPlansForTarget } from "@/lib/ferramentas/support-plan/queries";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: teacherClass } = await supabase
    .from("teacher_classes")
    .select("id, name")
    .eq("id", classId)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!teacherClass) notFound();

  const plans = await fetchPlansForTarget(supabase, "class_id", classId);

  return (
    <PlanTargetDetailClient
      target={{ kind: "turma", id: teacherClass.id, name: teacherClass.name }}
      plans={plans}
    />
  );
}
