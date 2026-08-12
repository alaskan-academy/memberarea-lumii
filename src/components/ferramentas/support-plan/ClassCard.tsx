import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import type { TeacherClassRow } from "@/lib/ferramentas/support-plan/actions";

export default function ClassCard({ teacherClass }: { teacherClass: TeacherClassRow }) {
  return (
    <Link
      href={`/ferramentas/plano-apoio-aluno/turma/${teacherClass.id}`}
      className="lumii-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f6614f]"
    >
      <div className="w-10 h-10 rounded-full bg-[#f6614f]/10 flex items-center justify-center shrink-0">
        <Users className="w-4 h-4 text-[#f6614f]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{teacherClass.name}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
