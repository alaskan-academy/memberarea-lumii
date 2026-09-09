import type { Metadata } from "next";
import { assertToolAccess } from "@/lib/ferramentas/access";
import { fetchResources } from "@/lib/ferramentas/planejamento/queries";
import BibliotecaClient from "@/components/ferramentas/planejamento/BibliotecaClient";

export const metadata: Metadata = { title: "Planejamento — Lumii" };

export default async function PlanejamentoPage() {
  const { user, supabase } = await assertToolAccess("planejamento");
  const resources = await fetchResources(supabase, user.id);
  return <BibliotecaClient initialResources={resources} />;
}
