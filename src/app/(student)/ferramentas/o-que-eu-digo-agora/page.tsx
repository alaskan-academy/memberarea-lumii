import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ParentScriptTool from "@/components/ferramentas/parent-scripts/ParentScriptTool";

export default async function OQueEuDigoAgoraPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
