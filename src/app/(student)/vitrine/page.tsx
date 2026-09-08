import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Vitrine — Lumii" };

export default function VitrinePage() {
  redirect("/cursos");
}
