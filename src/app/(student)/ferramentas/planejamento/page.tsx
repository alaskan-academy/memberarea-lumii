import type { Metadata } from "next";
import { assertToolAccess } from "@/lib/ferramentas/access";
import { fetchResources } from "@/lib/ferramentas/planejamento/queries";
import { fetchRubrics, fetchAllScores } from "@/lib/ferramentas/planejamento/rubricas/queries";
import PlanejamentoHub from "@/components/ferramentas/planejamento/PlanejamentoHub";

export const metadata: Metadata = { title: "Planejamento — Lumii" };

export default async function PlanejamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { user, supabase } = await assertToolAccess("planejamento");
  const { aba } = await searchParams;

  const [resources, rubrics, scores, { data: studentsRaw }] = await Promise.all([
    fetchResources(supabase, user.id),
    fetchRubrics(supabase, user.id),
    fetchAllScores(supabase, user.id),
    supabase.from("teacher_students").select("id, name").eq("teacher_id", user.id).order("name", { ascending: true }),
  ]);

  const students = (studentsRaw ?? []).map((s) => ({ id: s.id as string, name: s.name as string }));

  return (
    <PlanejamentoHub
      resources={resources}
      rubrics={rubrics}
      scores={scores}
      students={students}
      initialTab={aba === "rubricas" ? "rubricas" : "biblioteca"}
    />
  );
}
