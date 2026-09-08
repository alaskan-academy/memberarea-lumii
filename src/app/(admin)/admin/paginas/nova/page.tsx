import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PaginaFormClient from "../PaginaFormClient";
import { assertAdminPage } from "@/lib/supabase/admin-guard";

export default async function NovaPaginaPage() {
  await assertAdminPage();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/paginas"
          className="p-2 rounded-lg text-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nova Página</h1>
          <p className="text-sm text-foreground/50">Crie uma página estática de conteúdo</p>
        </div>
      </div>

      <PaginaFormClient id={null} />
    </div>
  );
}
