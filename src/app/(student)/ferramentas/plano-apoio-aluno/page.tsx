import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentListClient from "@/components/ferramentas/support-plan/StudentListClient";

export default async function PlanoApoioAlunoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: students } = await supabase
    .from("teacher_students")
    .select("id, name, age, class_label")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  return <StudentListClient initialStudents={students ?? []} />;
}
