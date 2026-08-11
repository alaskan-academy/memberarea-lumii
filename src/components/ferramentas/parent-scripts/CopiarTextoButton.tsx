"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopiarTextoButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border border-border hover:border-[#f6614f] hover:text-[#f6614f] transition-colors min-h-[44px]"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copiado!" : "Copiar texto"}
    </button>
  );
}
