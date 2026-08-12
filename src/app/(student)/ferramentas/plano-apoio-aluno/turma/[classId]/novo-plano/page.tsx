import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import NewPlanFlow from "@/components/ferramentas/support-plan/NewPlanFlow";

export default async function NovoPlanoTurmaPage({
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

  return <NewPlanFlow target={{ kind: "turma", id: teacherClass.id, name: teacherClass.name }} />;
}
