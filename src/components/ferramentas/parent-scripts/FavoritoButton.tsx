"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleParentScriptFavorite } from "@/lib/ferramentas/parent-scripts/actions";

export default function FavoritoButton({
  scriptKey,
  initialFavorited,
}: {
  scriptKey: string;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !favorited;
    setFavorited(next); // otimista
    startTransition(async () => {
      const res = await toggleParentScriptFavorite(scriptKey);
      if ("error" in res) setFavorited(!next); // reverte se falhar
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={favorited}
      className={cn(
        "flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border transition-colors min-h-[44px] disabled:opacity-60",
        favorited
          ? "border-[#eebc3e] bg-[#eebc3e]/10 text-[#a97e1a]"
          : "border-border hover:border-[#eebc3e] hover:text-[#a97e1a]"
      )}
    >
      <Star className={cn("w-4 h-4", favorited && "fill-current")} />
      {favorited ? "Favoritado" : "Favoritar"}
    </button>
  );
}
