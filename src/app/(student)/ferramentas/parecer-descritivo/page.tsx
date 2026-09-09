import type { Metadata } from "next";
import { assertToolAccess } from "@/lib/ferramentas/access";
import ParecerTool from "@/components/ferramentas/parecer/ParecerTool";

export const metadata: Metadata = { title: "Parecer descritivo — Lumii" };

export default async function ParecerDescritivoPage() {
  await assertToolAccess("parecer-descritivo");
  return <ParecerTool />;
}
