import { ShoppingBag } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";

type PaytEnrollment = {
  id: string;
  course_title: string | null;
  granted_at: string;
  expires_at: string | null;
};

/**
 * Server Component — busca as próprias matrículas via Payt desta aluna e
 * renderiza a seção completa. Extraído de aluna-detail.tsx pelo mesmo motivo
 * de CertificatesSection.tsx: exibição pura, sem interatividade.
 */
export default async function PurchasesSection({ userId }: { userId: string }) {
  const service = createServiceClient();
  const { data: rows } = await service
    .from("enrollments")
    .select("id, granted_at, expires_at, course:courses(title)")
    .eq("user_id", userId)
    .eq("source", "payt")
    .order("granted_at", { ascending: false });

  const paytEnrollments: PaytEnrollment[] = ((rows ?? []) as unknown as {
    id: string; granted_at: string; expires_at: string | null; course: { title: string } | null;
  }[]).map((e) => ({
    id: e.id,
    course_title: e.course?.title ?? null,
    granted_at: e.granted_at,
    expires_at: e.expires_at,
  }));

  const activeCount = paytEnrollments.filter(
    (e) => !e.expires_at || new Date(e.expires_at) > new Date()
  ).length;

  return (
    <section className="lumii-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <ShoppingBag className="w-4 h-4 text-[#f6614f]" />
        <h2 className="font-semibold">
          Compras{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({activeCount})
          </span>
        </h2>
      </div>
      {paytEnrollments.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground text-sm">
          Nenhuma compra registrada.
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {paytEnrollments.map((e) => {
            const revoked = !!e.expires_at && new Date(e.expires_at) <= new Date();
            return (
              <li key={e.id} className="px-5 py-3 space-y-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium line-clamp-1 flex-1 min-w-0">
                    {e.course_title ?? "Curso não identificado"}
                  </p>
                  {revoked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-600 shrink-0">
                      Revogado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#71c69a]/15 text-[#3d9e5a] shrink-0">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(e.granted_at).toLocaleString("pt-BR", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
                  })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
