import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PARENT_SCRIPTS } from "@/lib/ferramentas/parent-scripts/content";
import { SITUACOES } from "@/lib/ferramentas/parent-scripts/types";
import ScriptResultCard from "@/components/ferramentas/parent-scripts/ScriptResultCard";

export default async function FavoritosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: favorites } = await supabase
    .from("parent_script_favorites")
    .select("script_key")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const keys = (favorites ?? []).map((f) => f.script_key);
  const entries = keys
    .map((key) => PARENT_SCRIPTS.find((s) => s.key === key))
    .filter((e): e is (typeof PARENT_SCRIPTS)[number] => !!e);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        href="/ferramentas/o-que-eu-digo-agora"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        O que eu digo agora?
      </Link>

      <h1 className="text-2xl font-bold mb-6">Meus favoritos</h1>

      {entries.length === 0 ? (
        <div className="lumii-card p-6 text-center space-y-2">
          <p className="text-2xl">⭐</p>
          <p className="font-semibold">Nenhum script favoritado ainda</p>
          <p className="text-sm text-muted-foreground">
            Favorite um script para encontrá-lo rápido da próxima vez.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.key}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {SITUACOES.find((s) => s.value === entry.situacao)?.label}
              </p>
              <ScriptResultCard entry={entry} favorited logView={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
