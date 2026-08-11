import Link from "next/link";
import { ChevronRight, User } from "lucide-react";
import type { TeacherStudentRow } from "@/lib/ferramentas/support-plan/actions";

export default function StudentCard({ student }: { student: TeacherStudentRow }) {
  return (
    <Link
      href={`/ferramentas/plano-apoio-aluno/${student.id}`}
      className="lumii-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f6614f]"
    >
      <div className="w-10 h-10 rounded-full bg-[#f6614f]/10 flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-[#f6614f]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{student.name}</p>
        <p className="text-xs text-muted-foreground">
          {[student.age ? `${student.age} anos` : null, student.class_label].filter(Boolean).join(" · ") ||
            "Sem detalhes adicionais"}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
