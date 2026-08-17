"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, AlertCircle } from "lucide-react";
import { markLessonComplete } from "@/app/(student)/aulas/actions";

interface NextLessonButtonProps {
  nextLessonId: string;
  lessonId: string;
  isCompleted: boolean;
}

export default function NextLessonButton({
  nextLessonId,
  lessonId,
  isCompleted,
}: NextLessonButtonProps) {
  const router = useRouter();
  const [error, setError] = useState(false);

  function handleClick() {
    if (!isCompleted) {
      // Não bloqueia a navegação: a aluna segue para a próxima aula mesmo se
      // a marcação falhar, mas o erro fica sinalizado (ver LessonCompleteButton).
      markLessonComplete(lessonId).catch(() => setError(true));
    }
    router.push(`/aulas/${nextLessonId}`);
  }

  return (
    <div className="flex flex-col gap-1.5 w-full items-end">
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-[#f6614f] hover:bg-[#dd5747] active:bg-[#c54e3f] transition-colors px-3 py-2.5 min-h-[44px] rounded-lg"
      >
        Próxima
        <ChevronRight className="w-4 h-4 shrink-0" />
      </button>
      {error && (
        <span role="alert" className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5" />
          Não conseguimos marcar a aula anterior como concluída.
        </span>
      )}
    </div>
  );
}
