"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { UserCircle, Phone, Calendar, ShieldOff } from "lucide-react";
import { toggleBanAction } from "./[userId]/actions";

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

interface Props {
  profiles: ProfileRow[];
  enrollCount: Record<string, number>;
  emptyMessage: string;
}

export default function AlunosTable({ profiles, enrollCount, emptyMessage }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [banned, setBanned] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isBanned = (p: ProfileRow) => banned[p.id] ?? p.banned ?? false;
  const selectableIds = profiles.map((p) => p.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  }

  function handleBulkBan() {
    if (selected.size === 0) return;
    if (!confirm(`Banir ${selected.size} aluna${selected.size !== 1 ? "s" : ""} selecionada${selected.size !== 1 ? "s" : ""}? Elas não poderão acessar a plataforma.`)) return;
    setError(null);
    const ids = [...selected];
    startTransition(async () => {
      const results = await Promise.all(ids.map((id) => toggleBanAction(id, true)));
      const failed = results.filter((r) => r.error);
      const succeededIds = ids.filter((_, i) => !results[i].error);
      setBanned((prev) => {
        const next = { ...prev };
        for (const id of succeededIds) next[id] = true;
        return next;
      });
      if (failed.length > 0) {
        setError(`${failed.length} de ${ids.length} não puderam ser banidas.`);
      }
      setSelected(new Set());
    });
  }

  if (profiles.length === 0) {
    return (
      <div className="lumii-card overflow-hidden overflow-x-auto">
        <div className="py-16 text-center text-muted-foreground">
          <UserCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">
          {error}
        </p>
      )}

      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#f6614f]/10 border border-[#f6614f]/25">
          <span className="text-sm font-medium text-[#f6614f]">
            {selected.size} selecionada{selected.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={handleBulkBan}
            disabled={pending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            {pending ? "Banindo…" : "Banir selecionadas"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground ml-auto"
          >
            Limpar seleção
          </button>
        </div>
      )}

      <div className="lumii-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Selecionar todas nesta página"
                  className="accent-[#f6614f] w-4 h-4"
                />
              </th>
              <th className="text-left px-4 py-3 font-semibold text-foreground/70">
                Nome / E-mail
              </th>
              <th className="text-left px-4 py-3 font-semibold text-foreground/70 hidden md:table-cell">
                Telefone
              </th>
              <th className="text-left px-4 py-3 font-semibold text-foreground/70 hidden lg:table-cell">
                Nascimento
              </th>
              <th className="text-left px-4 py-3 font-semibold text-foreground/70 hidden xl:table-cell">
                Cadastro
              </th>
              <th className="text-center px-4 py-3 font-semibold text-foreground/70 hidden sm:table-cell">
                Matrículas
              </th>
              <th className="text-center px-4 py-3 font-semibold text-foreground/70">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {profiles.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    aria-label={`Selecionar ${p.full_name ?? p.email ?? "aluna"}`}
                    className="accent-[#f6614f] w-4 h-4"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "#f6614f" }}
                    >
                      {p.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[160px]">
                        {p.full_name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {p.email ?? "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {p.phone ? (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      {p.phone}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {p.date_of_birth ? (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {new Date(
                        p.date_of_birth + "T00:00:00"
                      ).toLocaleDateString("pt-BR")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="font-semibold">
                    {enrollCount[p.id] ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {isBanned(p) ? (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                      Banida
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#71c69a]/15 text-[#5bb577] text-xs font-medium">
                      Ativa
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/alunos/${p.id}`}
                    className="text-xs font-medium text-[#f6614f] hover:underline"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
