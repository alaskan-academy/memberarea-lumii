import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import Link from "next/link";
import {
  Download,
  UserPlus,
  TrendingUp,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import { hashCpf, decryptCpf } from "@/lib/cpf-crypto";
import AlunosSearch from "./alunos-search";
import AlunosTable from "./AlunosTable";
import SemCadastroClient, { type SemCadastroRow } from "./SemCadastroClient";

const PAGE_SIZE = 25;
const PAGE_SIZE_SC = 25;
const GRANT_EVENT_TYPES = ["paid", "approved", "completed", "confirmed"];

function isCpf(q: string) {
  return q.replace(/\D/g, "").length === 11;
}
function formatCpfRaw(q: string) {
  return q.replace(/\D/g, "");
}

type UnregisteredBuyerRpcRow = {
  email: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  created_at: string;
  courses: { id: string | null; title: string | null; slug: string | null; token: string; expires_at: string }[] | null;
  total_count: number;
};

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; scpage?: string; tab?: string }>;
}) {
  await getCurrentAdmin();

  const { q: rawQ, page: rawPage, scpage: rawScPage, tab: rawTab } = await searchParams;
  const activeTab =
    rawTab === "sem-cadastro" ? "sem-cadastro" : "cadastradas";
  const q = rawQ?.trim() ?? "";
  const page = Math.max(1, parseInt(rawPage ?? "1"));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const scPage = Math.max(1, parseInt(rawScPage ?? "1"));
  const scOffset = (scPage - 1) * PAGE_SIZE_SC;

  const service = createServiceClient();

  // ── Backfill cpf_hash (migração retroativa) ──────────────────────────────────
  {
    const { data: needsHash } = await service
      .from("profiles")
      .select("id, cpf_encrypted")
      .not("cpf_encrypted", "is", null)
      .is("cpf_hash", null);
    if (needsHash && needsHash.length > 0) {
      await Promise.all(
        (needsHash as { id: string; cpf_encrypted: string }[]).map(
          async (p) => {
            try {
              const digits = decryptCpf(p.cpf_encrypted).replace(/\D/g, "");
              await service
                .from("profiles")
                .update({ cpf_hash: hashCpf(digits) })
                .eq("id", p.id);
            } catch {
              // ignora falha de descriptografia
            }
          }
        )
      );
    }
  }

  // ── Dados para card de conversão (sempre) ─────────────────────────────────
  const [{ data: paidEvents }, { data: allProfileEmails }] = await Promise.all(
    [
      service
        .from("payment_events")
        .select("buyer_email")
        .eq("processed", true)
        .in("event_type", GRANT_EVENT_TYPES),
      service
        .from("profiles")
        .select("email")
        .neq("role", "admin"),
    ]
  );

  const uniqueBuyers = new Set(
    (paidEvents ?? [])
      .map((e) => e.buyer_email?.toLowerCase())
      .filter(Boolean) as string[]
  );
  const profileEmailSet = new Set(
    (allProfileEmails ?? [])
      .map((p) => p.email?.toLowerCase())
      .filter(Boolean) as string[]
  );
  const totalBuyers = uniqueBuyers.size;
  const withAccount = [...uniqueBuyers].filter((e) =>
    profileEmailSet.has(e)
  ).length;
  const pendingCount = totalBuyers - withAccount;
  const conversionRate =
    totalBuyers > 0 ? Math.round((withAccount / totalBuyers) * 100) : 0;

  // ── Dados "sem cadastro" — agrupado + paginado + buscado no Postgres (RPC) ──
  // A busca (q) é compartilhada com a aba "Cadastradas". Fora dessa aba,
  // pedimos só 1 linha — a RPC ainda retorna o total_count correto (window
  // function sobre o grupo inteiro), suficiente para o badge da aba.
  const { data: unregisteredRpc } = await service.rpc("admin_unregistered_buyers", {
    search: q || null,
    limit_n: activeTab === "sem-cadastro" ? PAGE_SIZE_SC : 1,
    offset_n: activeTab === "sem-cadastro" ? scOffset : 0,
  });

  const unregisteredRows = (unregisteredRpc ?? []) as UnregisteredBuyerRpcRow[];
  const semCadastroCount = unregisteredRows[0]?.total_count ?? 0;
  const semCadastro: SemCadastroRow[] = unregisteredRows.map((r) => ({
    email: r.email,
    buyer_name: r.buyer_name,
    buyer_phone: r.buyer_phone,
    created_at: r.created_at,
    courses: (r.courses ?? [])
      .filter((c) => c.id !== null)
      .map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        token: c.token,
        expires_at: c.expires_at,
      })),
  }));
  const totalPagesSC = Math.max(1, Math.ceil(semCadastroCount / PAGE_SIZE_SC));

  // ── Dados "cadastradas" (só no tab correspondente) ────────────────────────
  type ProfileRow = {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    date_of_birth: string | null;
    role: string;
    banned: boolean | null;
    created_at: string;
  };
  let profiles: ProfileRow[] = [];
  let count = 0;
  let cpfSearch = false;

  if (activeTab === "cadastradas") {
    if (q && isCpf(q)) {
      cpfSearch = true;
      const cpfDigits = formatCpfRaw(q);
      const cpfH = hashCpf(cpfDigits);

      const { data: byHash, count: hashCount } = await service
        .from("profiles")
        .select(
          "id, full_name, email, phone, date_of_birth, role, banned, created_at",
          { count: "exact" }
        )
        .eq("cpf_hash", cpfH)
        .neq("role", "admin");

      if ((byHash ?? []).length > 0) {
        profiles = (byHash ?? []) as ProfileRow[];
        count = hashCount ?? 0;
      } else {
        const { data: events } = await service
          .from("payment_events")
          .select("buyer_email")
          .filter("payload->customer->>doc", "eq", cpfDigits)
          .limit(10);
        const emails = [
          ...new Set(
            (events ?? []).map((e) => e.buyer_email).filter(Boolean)
          ),
        ];
        if (emails.length > 0) {
          const { data, count: c } = await service
            .from("profiles")
            .select(
              "id, full_name, email, phone, date_of_birth, role, banned, created_at",
              { count: "exact" }
            )
            .in("email", emails)
            .neq("role", "admin");
          profiles = (data ?? []) as ProfileRow[];
          count = c ?? 0;
        }
      }
    } else {
      let query = service
        .from("profiles")
        .select(
          "id, full_name, email, phone, date_of_birth, role, banned, created_at",
          { count: "exact" }
        )
        .neq("role", "admin")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
      const { data, count: c } = await query;
      profiles = (data ?? []) as ProfileRow[];
      count = c ?? 0;
    }
  }

  const profileIds = profiles.map((p) => p.id);
  const { data: enrollments } = profileIds.length
    ? await service
        .from("enrollments")
        .select("user_id")
        .in("user_id", profileIds)
    : { data: [] };
  const enrollCount: Record<string, number> = {};
  for (const e of enrollments ?? []) {
    enrollCount[e.user_id] = (enrollCount[e.user_id] ?? 0) + 1;
  }

  const totalPages =
    activeTab === "cadastradas" ? Math.ceil(count / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Alunas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie alunas e compradoras da plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/alunos/nova"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-lumii-coral text-white hover:bg-lumii-coral-hover transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Nova aluna
          </Link>
          <a
            href="/api/admin/alunos/export"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </a>
        </div>
      </div>

      {/* Card de conversão */}
      {totalBuyers > 0 && (
        <div className="lumii-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-lumii-coral" />
            <h2 className="text-sm font-semibold">
              Taxa de conversão compra → conta
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total compraram */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{totalBuyers}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Compraram
              </p>
            </div>
            {/* Com conta */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <UserCheck className="w-4 h-4 text-lumii-green" />
              </div>
              <p className="text-2xl font-bold text-lumii-green">{withAccount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Criaram conta
              </p>
            </div>
            {/* Pendentes */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <UserX className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pendentes</p>
            </div>
            {/* Taxa */}
            <div className="text-center">
              <div className="mb-1 h-5" />
              <p className="text-2xl font-bold text-lumii-coral">
                {conversionRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Taxa de ativação
              </p>
            </div>
          </div>
          {/* Barra de progresso */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${conversionRate}%`,
                background:
                  conversionRate >= 75
                    ? "#71c69a"
                    : conversionRate >= 50
                      ? "#f6614f"
                      : "#eebc3e",
              }}
            />
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          <Link
            href="/admin/alunos?tab=cadastradas"
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "cadastradas"
                ? "border-lumii-coral text-lumii-coral"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Cadastradas
            {activeTab === "cadastradas" && count > 0 && (
              <span className="ml-1 text-xs bg-lumii-coral/15 text-lumii-coral px-1.5 py-0.5 rounded-full font-semibold">
                {count}
              </span>
            )}
          </Link>
          <Link
            href="/admin/alunos?tab=sem-cadastro"
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "sem-cadastro"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <UserX className="w-4 h-4" />
            Sem cadastro
            {semCadastroCount > 0 && (
              <span
                className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === "sem-cadastro"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {semCadastroCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* Conteúdo do tab "Sem cadastro" */}
      {activeTab === "sem-cadastro" && (
        <>
          <AlunosSearch defaultValue={q} />
          <SemCadastroClient rows={semCadastro} />

          {/* Paginação */}
          {totalPagesSC > 1 && (
            <div className="flex items-center justify-center gap-2">
              {scPage > 1 && (
                <Link
                  href={`?tab=sem-cadastro&${q ? `q=${encodeURIComponent(q)}&` : ""}scpage=${scPage - 1}`}
                  className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
                >
                  ← Anterior
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Página {scPage} de {totalPagesSC}
              </span>
              {scPage < totalPagesSC && (
                <Link
                  href={`?tab=sem-cadastro&${q ? `q=${encodeURIComponent(q)}&` : ""}scpage=${scPage + 1}`}
                  className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
                >
                  Próxima →
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {/* Conteúdo do tab "Cadastradas" */}
      {activeTab === "cadastradas" && (
        <>
          <AlunosSearch defaultValue={q} />
          {cpfSearch && (
            <p className="text-xs text-lumii-coral">
              Buscando por CPF nos registros de compra.
            </p>
          )}

          <AlunosTable
            profiles={profiles}
            enrollCount={enrollCount}
            emptyMessage={
              q
                ? cpfSearch
                  ? "CPF não encontrado nos registros."
                  : "Nenhuma aluna encontrada. Tente um termo diferente."
                : "Nenhuma aluna encontrada"
            }
          />

          {/* Paginação */}
          {!cpfSearch && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${page - 1}`}
                  className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
                >
                  ← Anterior
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${page + 1}`}
                  className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
                >
                  Próxima →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
