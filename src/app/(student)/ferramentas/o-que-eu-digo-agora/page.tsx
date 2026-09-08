import type { Metadata } from "next";
import { assertToolAccess } from "@/lib/ferramentas/access";
import ParentScriptTool from "@/components/ferramentas/parent-scripts/ParentScriptTool";

export const metadata: Metadata = { title: "O que eu digo agora? — Lumii" };

export default async function OQueEuDigoAgoraPage() {
  const { user, supabase } = await assertToolAccess("o-que-eu-digo-agora");

  const { data: favorites } = await supabase
    .from("parent_script_favorites")
    .select("script_key")
    .eq("user_id", user.id);

  return (
    <ParentScriptTool
      initialFavorites={(favorites ?? []).map((f) => f.script_key)}
    />
  );
}
