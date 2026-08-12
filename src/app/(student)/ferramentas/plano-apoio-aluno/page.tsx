import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlanoApoioHub from "@/components/ferramentas/support-plan/PlanoApoioHub";

export default async function PlanoApoioAlunoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
