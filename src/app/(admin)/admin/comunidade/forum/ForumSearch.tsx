"use client";

import { useRef } from "react";
import { Search } from "lucide-react";

export default function ForumSearch({ defaultValue }: { defaultValue: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} method="GET" className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <label htmlFor="forum-search-q" className="sr-only">
        Buscar por título do post
      </label>
      <input
        id="forum-search-q"
        name="q"
        defaultValue={defaultValue}
        placeholder="Buscar por título do post…"
        className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-lumii-coral/40 focus:border-lumii-coral"
        onChange={(e) => {
          if (e.target.value === "") formRef.current?.submit();
        }}
      />
    </form>
  );
}
