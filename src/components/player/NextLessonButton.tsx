"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
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

  function handleClick() {
    if (!isCompleted) {
      markLessonComplete(lessonId).catch(() => {});
    }
    router.push(`/aulas/${nextLessonId}`);
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-[#f6614f] hover:bg-[#dd5747] active:bg-[#c54e3f] transition-colors px-3 py-2.5 min-h-[44px] rounded-lg"
    >
      Próxima
      <ChevronRight className="w-4 h-4 shrink-0" />
    </button>
  );
}
