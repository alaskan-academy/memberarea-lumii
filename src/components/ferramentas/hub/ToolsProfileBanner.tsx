"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { updateToolsProfile } from "@/lib/ferramentas/actions";

const DISMISS_KEY = "lumii_tools_profile_dismissed";

export default function ToolsProfileBanner() {
  const [visible, setVisible] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Só decide a visibilidade após montar no cliente (localStorage não existe no
    // SSR); começar oculto e revelar no efeito evita hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!localStorage.getItem(DISMISS_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  function save() {
    if (!isParent && !isTeacher) return;
    setError(null);
    startTransition(async () => {
      const res = await updateToolsProfile({ is_parent: isParent, is_teacher: isTeacher });
      if (res?.error) {
        setError(res.error);
        return; // não dispensa — o perfil não foi salvo
      }
      dismiss();
    });
  }

  if (!visible) return null;

  return (
    <div className="lumii-card p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
      <p className="text-sm font-medium flex-1">Você é mãe/pai, professor(a), ou os dois?</p>
      <div className="flex items-center gap-3 flex-wrap">
        {error && <p role="alert" className="w-full sm:w-auto text-xs text-red-500 order-last sm:order-none">{error}</p>}
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isParent}
            onChange={(e) => setIsParent(e.target.checked)}
            className="w-4 h-4 accent-lumii-coral"
          />
          Mãe/Pai
        </label>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isTeacher}
            onChange={(e) => setIsTeacher(e.target.checked)}
            className="w-4 h-4 accent-lumii-coral"
          />
          Professor(a)
        </label>
        <button
          type="button"
          onClick={save}
          disabled={isPending || (!isParent && !isTeacher)}
          className="text-sm font-semibold text-white bg-lumii-coral hover:bg-lumii-coral-hover disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar"
          className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
