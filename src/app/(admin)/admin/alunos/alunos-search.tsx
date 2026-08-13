"use client";

import { useRef } from "react";
import { Search } from "lucide-react";

export default function AlunosSearch({ defaultValue }: { defaultValue: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} method="GET" className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <label htmlFor="alunos-search-q" className="sr-only">
        Buscar por nome, e-mail ou CPF
      </label>
      <input
        id="alunos-search-q"
        name="q"
        defaultValue={defaultValue}
        placeholder="Buscar por nome, e-mail ou CPF…"
        className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f6614f]/40 focus:border-[#f6614f]"
        onChange={(e) => {
          if (e.target.value === "") formRef.current?.submit();
        }}
      />
    </form>
  );
}
