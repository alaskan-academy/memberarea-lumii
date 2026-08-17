import { Award, ExternalLink } from "lucide-react";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";

type Certificate = {
  id: string;
  verify_hash: string;
  issued_at: string;
  course: { title: string } | null;
};

/**
 * Server Component — busca os próprios dados (certificados desta aluna) e
 * renderiza a seção completa. Extraído de aluna-detail.tsx (que era um único
 * client component de 1200+ linhas) porque essa seção é puramente exibição,
 * sem nenhuma interatividade — não precisa rodar no cliente.
 */
export default async function CertificatesSection({ userId }: { userId: string }) {
  const service = createServiceClient();
  const { data: certificatesRaw } = await service
    .from("certificates")
    .select("id, verify_hash, issued_at, course:courses(title)")
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });

  const certificates = (certificatesRaw ?? []) as unknown as Certificate[];

  return (
    <section className="lumii-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <Award className="w-4 h-4 text-[#eebc3e]" />
        <h2 className="font-semibold">
          Certificados{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({certificates.length})
          </span>
        </h2>
      </div>
      {certificates.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground text-sm">
          Nenhum certificado.
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {certificates.map((c) => (
            <li key={c.id} className="px-5 py-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium line-clamp-1">
                  {c.course?.title ?? "Curso"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.issued_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                </p>
              </div>
              <Link
                href={`/verificar/${c.verify_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f6614f] hover:text-[#dd5747]"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
