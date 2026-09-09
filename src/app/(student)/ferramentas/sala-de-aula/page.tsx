import type { Metadata } from "next";
import { assertToolAccess } from "@/lib/ferramentas/access";
import SalaDeAulaHub from "@/components/ferramentas/sala/SalaDeAulaHub";

export const metadata: Metadata = { title: "Sala de aula — Lumii" };

export default async function SalaDeAulaPage() {
  // Grátis, mas exige login como qualquer rota (política 100% fechado).
  const { user, supabase } = await assertToolAccess("sala-de-aula");

  // Roster do professor (se tiver) — usado no Sorteio para carregar uma turma.
  // Quem não tem alunos cadastrados (ex.: conta grátis/pais) recebe lista vazia
  // e o Sorteio segue só com a lista manual.
  const { data: students } = await supabase
    .from("teacher_students")
    .select("name, class_label")
    .eq("teacher_id", user.id)
    .order("name", { ascending: true });

  const roster = (students ?? []).map((s) => ({
    name: s.name as string,
    classLabel: (s.class_label as string | null) ?? null,
  }));

  return <SalaDeAulaHub students={roster} />;
}
