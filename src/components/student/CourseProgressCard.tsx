"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseMenuModal, type CourseMenuModule } from "./CourseMenuModal";

export type CourseCardData = {
  course: {
    id: string;
    slug: string;
    title: string;
    thumbnail_url: string | null;
    workload_hours: number;
  };
  progress: { completed: number; total: number; percentage: number };
  lastLessonId: string | null;
  firstLessonId: string | null;
  lastAccess: string | null;
  modules: CourseMenuModule[];
  completedLessonIds: string[];
};

export function CourseProgressCard({ card }: { card: CourseCardData }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { course, progress, lastLessonId, firstLessonId } = card;
  const isComplete = progress.percentage === 100;
  const hasStarted = !!lastLessonId;

  // Próxima aula = a que vem após a última assistida na ordem
  const flatLessons = [...card.modules]
    .sort((a, b) => a.position - b.position)
    .flatMap(m => [...m.lessons].sort((a, b) => a.position - b.position));
  const lastIdx = lastLessonId ? flatLessons.findIndex(l => l.id === lastLessonId) : -1;
  const nextLessonId = lastIdx >= 0 && lastIdx < flatLessons.length - 1
    ? flatLessons[lastIdx + 1].id
    : null;

  // Botão "Continuar" vai para a próxima aula
  const href = nextLessonId
    ? `/aulas/${nextLessonId}`
    : lastLessonId
    ? `/aulas/${lastLessonId}`
    : firstLessonId
    ? `/aulas/${firstLessonId}`
    : `/cursos/${course.slug}`;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setModalOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setModalOpen(true); } }}
        className="lumii-card overflow-hidden flex flex-col cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f6614f]"
      >
        {/* Thumbnail */}
        <div className="aspect-video bg-muted relative overflow-hidden group/thumb">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              sizes="(max-width: 640px) 50vw, 320px"
              className="object-cover group-hover/thumb:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#f6614f]/10 text-3xl">
              🎨
            </div>
          )}
          {isComplete && (
            <div className="absolute top-2 right-2 bg-[#71c69a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Concluído ✓
            </div>
          )}
          {/* Ícone de menu ao hover */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-white/90 text-[#f6614f] text-xs font-semibold px-3 py-1.5 rounded-full">
              Ver conteúdo
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] leading-5 group-hover:text-[#f6614f] transition-colors">
            {course.title}
          </h3>

          {progress.total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span>{progress.completed}/{progress.total} aulas</span>
                <span className={cn("font-semibold", isComplete ? "text-[#71c69a]" : "text-[#f6614f]")}>
                  {progress.percentage}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress.percentage}%`,
                    background: isComplete ? "#71c69a" : "#f6614f",
                  }}
                />
              </div>
            </div>
          )}

          {/* Botão Continuar — stopPropagation para não abrir o modal */}
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "mt-auto flex items-center justify-center gap-2 py-2.5 px-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors",
              isComplete
                ? "bg-[#71c69a]/15 text-[#71c69a] hover:bg-[#71c69a]/25"
                : hasStarted
                ? "bg-[#f6614f] text-white hover:bg-[#5580d4]"
                : "bg-muted text-foreground hover:bg-muted/80"
            )}
          >
            {isComplete ? (
              <><RotateCcw className="w-3.5 h-3.5" />Rever curso</>
            ) : hasStarted ? (
              <><Play className="w-3.5 h-3.5 fill-current" />Continuar</>
            ) : (
              <><Play className="w-3.5 h-3.5" />Começar</>
            )}
          </Link>
        </div>
      </div>

      <CourseMenuModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        course={course}
        modules={card.modules}
        completedLessonIds={card.completedLessonIds}
        lastLessonId={lastLessonId}
        firstLessonId={firstLessonId}
        nextLessonId={nextLessonId}
        progress={progress}
      />
    </>
  );
}
