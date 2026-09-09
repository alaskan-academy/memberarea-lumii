import type { Metadata } from "next";
import { assertToolAccess } from "@/lib/ferramentas/access";
import PlanoApoioHub from "@/components/ferramentas/support-plan/PlanoApoioHub";

export const metadata: Metadata = { title: "Meus Alunos — Lumii" };

export default async function MeusAlunosPage() {
  const { user, supabase } = await assertToolAccess("meus-alunos");

  const [{ data: students }, { data: classes }] = await Promise.all([
    supabase
      .from("teacher_students")
      .select("id, name, age, class_label")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("teacher_classes")
      .select("id, name")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return <PlanoApoioHub initialStudents={students ?? []} initialClasses={classes ?? []} />;
}
