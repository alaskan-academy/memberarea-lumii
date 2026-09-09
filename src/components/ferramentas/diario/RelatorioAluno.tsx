"use client";

import { useMemo, useState } from "react";
import { Copy, Printer, Check, BookOpen, ClipboardList, ClipboardCheck, Target } from "lucide-react";
import { DIARIO_TIPOS, type StudentLogRow } from "@/lib/ferramentas/diario/types";
import type { SupportPlanRow } from "@/lib/ferramentas/support-plan/types";
import { corDoNivel, type StudentRubricScore } from "@/lib/ferramentas/planejamento/rubricas/types";
import { GOAL_AREA_MAP, GOAL_STATUS_MAP, type GoalRow } from "@/lib/ferramentas/metas/types";

const CHECKIN_LABEL: Record<string, string> = { melhorou: "melhorou", igual: "igual", piorou: "piorou" };

function hojeExtenso(): string {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}
function formatData(s: string): string {
  return new Date(`${s}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function formatDataLonga(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export default function RelatorioAluno({
  student,
  logs,
  plans,
  goals,
  scores,
}: {
  student: { name: string };
  logs: StudentLogRow[];
  plans: SupportPlanRow[];
  goals: GoalRow[];
  scores: StudentRubricScore[];
}) {
  const [copied, setCopied] = useState(false);
  const [printError, setPrintError] = useState(false);
  const hoje = hojeExtenso();

  const logsPorTipo = useMemo(() => {
    const m = new Map<string, StudentLogRow[]>();
    for (const l of logs) {
      const arr = m.get(l.tipo) ?? [];
      arr.push(l);
      m.set(l.tipo, arr);
    }
    return m;
  }, [logs]);

  const activePlan = plans.find((p) => p.status === "ativo") ?? null;
  const pastPlans = plans.filter((p) => p.status !== "ativo");
  const totalCheckins = plans.reduce((acc, p) => acc + p.checkins.length, 0);
  const checkinResumo = useMemo(() => {
    const c = { melhorou: 0, igual: 0, piorou: 0 };
    for (const p of plans) for (const ck of p.checkins) c[ck.status] += 1;
    return c;
  }, [plans]);

  const vazio = logs.length === 0 && plans.length === 0 && goals.length === 0 && scores.length === 0;

  function montarTexto(): string {
    const linhas: string[] = [];
    linhas.push(`RELATÓRIO DE ACOMPANHAMENTO`, `Aluno: ${student.name}`, `Gerado em: ${hoje}`, "");
    if (logs.length) {
      linhas.push(`DIÁRIO DE BORDO (${logs.length} ${logs.length === 1 ? "registro" : "registros"})`);
      for (const t of DIARIO_TIPOS) {
        const arr = logsPorTipo.get(t.value);
        if (!arr?.length) continue;
        linhas.push(`• ${t.label}:`);
        for (const l of arr) linhas.push(`   - ${formatData(l.data)}: ${l.texto}`);
      }
      linhas.push("");
    }
    if (activePlan || pastPlans.length) {
      linhas.push(`PLANO DE APOIO`);
      if (activePlan) linhas.push(`Ativo — Objetivo: ${activePlan.plano_gerado.objetivo}`, `O que observar: ${activePlan.plano_gerado.o_que_observar}`);
      for (const p of pastPlans) linhas.push(`Anterior (${formatDataLonga(p.created_at)}): ${p.plano_gerado.objetivo}`);
      if (totalCheckins) linhas.push(`Check-ins: ${checkinResumo.melhorou} melhorou, ${checkinResumo.igual} igual, ${checkinResumo.piorou} piorou`);
      linhas.push("");
    }
    if (goals.length) {
      linhas.push(`METAS SOCIOEMOCIONAIS`);
      for (const g of goals) {
        const areaLabel = GOAL_AREA_MAP[g.area]?.label ?? g.area;
        const statusLabel = GOAL_STATUS_MAP[g.status]?.label ?? g.status;
        linhas.push(`• [${areaLabel} · ${statusLabel}] ${g.meta}`);
      }
      linhas.push("");
    }
    if (scores.length) {
      linhas.push(`AVALIAÇÕES (RUBRICAS)`);
      for (const sc of scores) {
        linhas.push(`${sc.rubricTitulo} — ${formatDataLonga(sc.created_at)}`);
        for (const it of sc.itens) {
          const nivel = sc.niveis[it.id];
          if (nivel === undefined) continue;
          linhas.push(`   - ${it.nome}: ${sc.escala[nivel] ?? "—"}`);
        }
        if (sc.comentario) linhas.push(`   Comentário: ${sc.comentario}`);
      }
    }
    return linhas.join("\n").trim();
  }

  function copiar() {
    navigator.clipboard
      .writeText(montarTexto())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  }

  function imprimir() {
    const w = window.open("", "_blank", "width=820,height=1000");
    if (!w) {
      setPrintError(true);
      return;
    }
    setPrintError(false);
    const partes: string[] = [];
    if (logs.length) {
      partes.push(`<h2>Diário de bordo <span class="muted">(${logs.length})</span></h2>`);
      for (const t of DIARIO_TIPOS) {
        const arr = logsPorTipo.get(t.value);
        if (!arr?.length) continue;
        partes.push(`<h3>${escapeHtml(t.label)}</h3><ul>`);
        for (const l of arr) partes.push(`<li><b>${escapeHtml(formatData(l.data))}</b> — ${escapeHtml(l.texto)}</li>`);
        partes.push(`</ul>`);
      }
    }
    if (activePlan || pastPlans.length) {
      partes.push(`<h2>Plano de apoio</h2>`);
      if (activePlan) {
        partes.push(
          `<h3>Plano ativo</h3>`,
          `<p><b>Objetivo:</b> ${escapeHtml(activePlan.plano_gerado.objetivo)}</p>`,
          `<p><b>O que observar:</b> ${escapeHtml(activePlan.plano_gerado.o_que_observar)}</p>`
        );
      }
      if (pastPlans.length) {
        partes.push(`<h3>Planos anteriores</h3><ul>`);
        for (const p of pastPlans) partes.push(`<li><b>${escapeHtml(formatDataLonga(p.created_at))}</b> — ${escapeHtml(p.plano_gerado.objetivo)}</li>`);
        partes.push(`</ul>`);
      }
      if (totalCheckins) partes.push(`<p><b>Check-ins:</b> ${checkinResumo.melhorou} melhorou · ${checkinResumo.igual} igual · ${checkinResumo.piorou} piorou</p>`);
    }
    if (goals.length) {
      partes.push(`<h2>Metas socioemocionais</h2><ul>`);
      for (const g of goals) {
        const areaLabel = GOAL_AREA_MAP[g.area]?.label ?? g.area;
        const statusLabel = GOAL_STATUS_MAP[g.status]?.label ?? g.status;
        partes.push(`<li><b>${escapeHtml(areaLabel)}</b> · ${escapeHtml(statusLabel)} — ${escapeHtml(g.meta)}</li>`);
      }
      partes.push(`</ul>`);
    }
    if (scores.length) {
      partes.push(`<h2>Avaliações</h2>`);
      for (const sc of scores) {
        partes.push(`<h3>${escapeHtml(sc.rubricTitulo)} <span class="muted">${escapeHtml(formatDataLonga(sc.created_at))}</span></h3><ul>`);
        for (const it of sc.itens) {
          const nivel = sc.niveis[it.id];
          if (nivel === undefined) continue;
          partes.push(`<li>${escapeHtml(it.nome)}: <b>${escapeHtml(sc.escala[nivel] ?? "—")}</b></li>`);
        }
        partes.push(`</ul>`);
        if (sc.comentario) partes.push(`<p class="muted">${escapeHtml(sc.comentario)}</p>`);
      }
    }
    w.document.write(
      `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório — ${escapeHtml(student.name)}</title><style>` +
        `*{box-sizing:border-box}body{font-family:'Poppins',system-ui,sans-serif;color:#212d42;max-width:720px;margin:0 auto;padding:40px}` +
        `h1{color:#f6614f;font-size:26px;margin:0 0 4px}.sub{color:#6b7280;font-size:13px;margin:0 0 24px;border-bottom:2px solid #eee;padding-bottom:16px}` +
        `h2{font-size:18px;margin:24px 0 8px;color:#212d42}h3{font-size:14px;margin:12px 0 4px;color:#f6614f}` +
        `ul{margin:4px 0 8px;padding-left:20px}li{font-size:13px;line-height:1.6;margin:2px 0}p{font-size:13px;line-height:1.6;margin:4px 0}` +
        `.muted{color:#9ca3af;font-weight:400}@media print{body{padding:0}}` +
        `</style></head><body><h1>Relatório de acompanhamento</h1><p class="sub"><b>${escapeHtml(student.name)}</b> · gerado em ${escapeHtml(hoje)}</p>` +
        partes.join("") +
        `<script>window.onload=function(){window.print()}<\/script></body></html>`
    );
    w.document.close();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Tudo sobre {student.name.split(" ")[0]} num lugar só — pronto para o conselho ou a reunião.
        </p>
        {!vazio && (
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={copiar} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-border hover:border-lumii-coral hover:text-lumii-coral transition-colors min-h-[44px]">
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              <span className="sr-only sm:not-sr-only">{copied ? "Copiado" : "Copiar"}</span>
            </button>
            <button type="button" onClick={imprimir} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-lumii-coral hover:bg-lumii-coral-hover transition-colors min-h-[44px]">
              <Printer className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only">Imprimir</span>
            </button>
          </div>
        )}
      </div>

      {printError && (
        <p role="alert" className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          Não foi possível abrir a janela de impressão — verifique o bloqueador de pop-ups, ou use “Copiar”.
        </p>
      )}

      {vazio ? (
        <div className="text-center py-10 text-muted-foreground">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Ainda não há o que consolidar.</p>
          <p className="text-xs mt-1">Registre o diário, um plano de apoio ou uma avaliação — tudo aparece aqui.</p>
        </div>
      ) : (
        <div className="lumii-card p-5 sm:p-6 space-y-6">
          <div className="border-b border-border/60 pb-3">
            <p className="text-lg font-bold text-foreground">Relatório de acompanhamento</p>
            <p className="text-xs text-muted-foreground">{student.name} · gerado em {hoje}</p>
          </div>

          {/* Diário */}
          {logs.length > 0 && (
            <section>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground mb-2">
                <BookOpen className="w-4 h-4 text-lumii-coral" /> Diário de bordo
                <span className="text-xs font-normal text-muted-foreground">({logs.length})</span>
              </h3>
              <div className="space-y-3">
                {DIARIO_TIPOS.map((t) => {
                  const arr = logsPorTipo.get(t.value);
                  if (!arr?.length) return null;
                  return (
                    <div key={t.value}>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${t.chip}`}>
                        <span aria-hidden>{t.emoji}</span> {t.label}
                      </span>
                      <ul className="mt-1.5 space-y-1">
                        {arr.map((l) => (
                          <li key={l.id} className="text-sm text-foreground/85">
                            <span className="text-xs text-muted-foreground mr-1.5">{formatData(l.data)}</span>
                            {l.texto}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Plano de apoio */}
          {(activePlan || pastPlans.length > 0) && (
            <section>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground mb-2">
                <ClipboardList className="w-4 h-4 text-lumii-coral" /> Plano de apoio
              </h3>
              {activePlan && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Plano ativo</p>
                  <p className="text-sm text-foreground/85"><span className="font-medium">Objetivo:</span> {activePlan.plano_gerado.objetivo}</p>
                  <p className="text-sm text-foreground/85 mt-1"><span className="font-medium">O que observar:</span> {activePlan.plano_gerado.o_que_observar}</p>
                </div>
              )}
              {pastPlans.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Planos anteriores ({pastPlans.length})</p>
                  <ul className="space-y-0.5">
                    {pastPlans.map((p) => (
                      <li key={p.id} className="text-sm text-foreground/85">
                        <span className="text-xs text-muted-foreground mr-1.5">{formatDataLonga(p.created_at)}</span>
                        {p.plano_gerado.objetivo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {totalCheckins > 0 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Check-ins: {checkinResumo.melhorou} {CHECKIN_LABEL.melhorou} · {checkinResumo.igual} {CHECKIN_LABEL.igual} · {checkinResumo.piorou} {CHECKIN_LABEL.piorou}
                </p>
              )}
            </section>
          )}

          {/* Metas socioemocionais */}
          {goals.length > 0 && (
            <section>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground mb-2">
                <Target className="w-4 h-4 text-lumii-coral" /> Metas socioemocionais
              </h3>
              <div className="space-y-2">
                {goals.map((g) => {
                  const am = GOAL_AREA_MAP[g.area] ?? GOAL_AREA_MAP.outra;
                  const sm = GOAL_STATUS_MAP[g.status] ?? GOAL_STATUS_MAP.em_andamento;
                  return (
                    <div key={g.id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${am.chip}`}>
                          <span aria-hidden>{am.emoji}</span> {am.label}
                        </span>
                        <p className="text-sm text-foreground/85 mt-1">{g.meta}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${sm.chip}`}>{sm.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Avaliações */}
          {scores.length > 0 && (
            <section>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground mb-2">
                <ClipboardCheck className="w-4 h-4 text-lumii-coral" /> Avaliações
              </h3>
              <div className="space-y-3">
                {scores.map((sc) => (
                  <div key={sc.id}>
                    <p className="text-sm font-semibold text-foreground">
                      {sc.rubricTitulo} <span className="text-xs font-normal text-muted-foreground">· {formatDataLonga(sc.created_at)}</span>
                    </p>
                    <div className="mt-1 space-y-1">
                      {sc.itens.map((it) => {
                        const nivel = sc.niveis[it.id];
                        if (nivel === undefined) return null;
                        return (
                          <div key={it.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-foreground/80 min-w-0 truncate">{it.nome}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${corDoNivel(nivel, sc.escala.length)}`}>
                              {sc.escala[nivel] ?? "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {sc.comentario && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words">{sc.comentario}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
