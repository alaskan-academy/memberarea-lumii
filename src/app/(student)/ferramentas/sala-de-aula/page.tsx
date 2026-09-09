import type { Metadata } from "next";
import { assertToolAccess } from "@/lib/ferramentas/access";
import SalaDeAulaHub from "@/components/ferramentas/sala/SalaDeAulaHub";

export const metadata: Metadata = { title: "Sala de aula — Lumii" };

export default async function SalaDeAulaPage() {
  // Grátis, mas exige login como qualquer rota (política 100% fechado).
  await assertToolAccess("sala-de-aula");
  return <SalaDeAulaHub />;
}
