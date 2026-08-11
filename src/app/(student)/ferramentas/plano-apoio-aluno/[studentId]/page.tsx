import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import StudentDetailClient, {
  type SupportPlanRow,
  type CheckinRow,
} from "@/components/ferramentas/support-plan/StudentDetailClient";

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

  const { data: plansRaw } = await supabase
    .from("support_plans")
    .select("id, dificuldade_principal, status, plano_gerado, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const planIds = (plansRaw ?? []).map((p) => p.id);

  const { data: checkinsRaw } = planIds.length
    ? await supabase
        .from("support_plan_checkins")
        .select("id, support_plan_id, status, notes, created_at")
        .in("support_plan_id", planIds)
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; support_plan_id: string; status: string; notes: string | null; created_at: string }[] };

  const checkinsByPlan = new Map<string, CheckinRow[]>();
  for (const c of checkinsRaw ?? []) {
    const list = checkinsByPlan.get(c.support_plan_id) ?? [];
    list.push({
      id: c.id,
      status: c.status as CheckinRow["status"],
      notes: c.notes,
      created_at: c.created_at,
    });
    checkinsByPlan.set(c.support_plan_id, list);
  }

  const plans: SupportPlanRow[] = (plansRaw ?? []).map((p) => ({
    id: p.id,
    dificuldade_principal: p.dificuldade_principal,
    status: p.status as SupportPlanRow["status"],
    plano_gerado: p.plano_gerado as SupportPlanRow["plano_gerado"],
    created_at: p.created_at,
    checkins: checkinsByPlan.get(p.id) ?? [],
  }));

  return <StudentDetailClient studentId={student.id} studentName={student.name} plans={plans} />;
}
