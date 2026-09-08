"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Textarea que cresce pra caber o conteúdo. Sem `maxHeight` cresce sem limite;
 *  com `maxHeight` (px) cresce até esse teto e então rola por dentro. */
export default function AutoGrowTextarea({
  value,
  onChange,
  className,
  maxHeight,
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  maxHeight?: number;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const h = maxHeight ? Math.min(el.scrollHeight, maxHeight) : el.scrollHeight;
    el.style.height = `${h}px`;
    el.style.overflowY = maxHeight && el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value, maxHeight]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      aria-label={rest["aria-label"] ?? (typeof rest.placeholder === "string" ? rest.placeholder : undefined)}
      className={cn(
        "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lumii-coral/40 resize-none overflow-hidden",
        className
      )}
      {...rest}
    />
  );
}
