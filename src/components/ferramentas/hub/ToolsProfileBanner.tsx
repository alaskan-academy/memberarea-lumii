"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { updateToolsProfile } from "@/lib/ferramentas/actions";

const DISMISS_KEY = "lumii_tools_profile_dismissed";

export default function ToolsProfileBanner() {
  const [visible, setVisible] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!localStorage.getItem(DISMISS_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  function save() {
    if (!isParent && !isTeacher) return;
    startTransition(async () => {
      await updateToolsProfile({ is_parent: isParent, is_teacher: isTeacher });
      dismiss();
    });
  }

  if (!visible) return null;

  return (
    <div className="lumii-card p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
      <p className="text-sm font-medium flex-1">Você é mãe/pai, professor(a), ou os dois?</p>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isParent}
            onChange={(e) => setIsParent(e.target.checked)}
            className="w-4 h-4 accent-[#f6614f]"
          />
          Mãe/Pai
        </label>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isTeacher}
            onChange={(e) => setIsTeacher(e.target.checked)}
            className="w-4 h-4 accent-[#f6614f]"
          />
          Professor(a)
        </label>
        <button
          type="button"
          onClick={save}
          disabled={isPending || (!isParent && !isTeacher)}
          className="text-sm font-semibold text-white bg-[#f6614f] hover:bg-[#e2543f] disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
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
