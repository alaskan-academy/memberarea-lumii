"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Textarea que cresce pra caber o conteúdo — nunca mostra scroll interno. */
export default function AutoGrowTextarea({
  value,
  onChange,
  className,
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      aria-label={rest["aria-label"] ?? (typeof rest.placeholder === "string" ? rest.placeholder : undefined)}
      className={cn(
        "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f6614f]/40 resize-none overflow-hidden",
        className
      )}
      {...rest}
    />
  );
}
