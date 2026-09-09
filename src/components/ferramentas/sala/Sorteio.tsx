"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Shuffle, RotateCcw, Users, User } from "lucide-react";

const NOMES_KEY = "lumii-sala-nomes";

export type SortStudent = { name: string; classLabel: string | null };

type Modo = "um" | "grupos";
type AgruparPor = "tamanho" | "quantidade";

function parseNomes(raw: string): string[] {
  return raw
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);
}

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Sorteio({ students }: { students: SortStudent[] }) {
  const [raw, setRaw] = useState("");
  const [modo, setModo] = useState<Modo>("um");

  // Turmas do professor (os class_labels distintos dos alunos cadastrados).
  const turmas = useMemo(
    () => [...new Set(students.map((s) => s.classLabel).filter((c): c is string => !!c))].sort(),
    [students]
  );

  // Carrega os nomes de uma turma (ou de todos os alunos) na lista do sorteio.
  function carregarTurma(valor: string) {
    if (!valor) return;
    const nomesTurma = (valor === "__all__" ? students : students.filter((s) => s.classLabel === valor)).map((s) => s.name);
    if (nomesTurma.length) setRaw(nomesTurma.join("\n"));
  }

  // Sortear um
  const [naoRepetir, setNaoRepetir] = useState(true);
  const [pickedIdx, setPickedIdx] = useState<number[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Grupos
  const [agruparPor, setAgruparPor] = useState<AgruparPor>("quantidade");
  const [n, setN] = useState(2);
  const [grupos, setGrupos] = useState<string[][] | null>(null);

  const nomes = parseNomes(raw);

  // Restaura a lista salva no aparelho (conveniência, não é dado no servidor).
  // Lê o localStorage só após montar para não quebrar a hidratação (SSR não tem
  // localStorage) — exceção legítima à regra de setState-em-effect.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOMES_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setRaw(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(NOMES_KEY, raw);
    } catch {
      /* ignore */
    }
  }, [raw]);

  // Limpa o timer da animação ao desmontar.
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Se a lista mudar, o histórico de "já sorteados" perde sentido — ajuste de
  // estado durante o render (padrão React recomendado, sem efeito).
  const [prevRaw, setPrevRaw] = useState(raw);
  if (raw !== prevRaw) {
    setPrevRaw(raw);
    setPickedIdx([]);
    setCurrent(null);
    setGrupos(null);
  }

  const disponiveis = naoRepetir
    ? nomes.map((_, i) => i).filter((i) => !pickedIdx.includes(i))
    : nomes.map((_, i) => i);

  const todosSorteados = naoRepetir && nomes.length > 0 && disponiveis.length === 0;

  function sortearUm() {
    if (rolling || nomes.length === 0 || disponiveis.length === 0) return;
    const finalIdx = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    setRolling(true);
    let ticks = 0;
    const maxTicks = 16;
    intervalRef.current = setInterval(() => {
      ticks++;
      setCurrent(nomes[Math.floor(Math.random() * nomes.length)]);
      if (ticks >= maxTicks) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setCurrent(nomes[finalIdx]);
        if (naoRepetir) setPickedIdx((p) => [...p, finalIdx]);
        setRolling(false);
      }
    }, 75);
  }

  function resetSorteio() {
    setPickedIdx([]);
    setCurrent(null);
  }

  function formarGrupos() {
    if (nomes.length === 0) return;
    const shuffled = embaralhar(nomes);
    let result: string[][] = [];
    if (agruparPor === "tamanho") {
      const size = Math.max(1, Math.min(n, nomes.length));
      for (let i = 0; i < shuffled.length; i += size) {
        result.push(shuffled.slice(i, i + size));
      }
    } else {
      const q = Math.max(1, Math.min(n, nomes.length));
      result = Array.from({ length: q }, () => [] as string[]);
      shuffled.forEach((nome, i) => result[i % q].push(nome));
    }
    setGrupos(result);
  }

  return (
    <div className="space-y-5">
      {/* Lista de nomes */}
      <div className="lumii-card p-4 sm:p-5 space-y-2">
        <label htmlFor="sorteio-nomes" className="text-sm font-semibold text-foreground">
          Nomes da turma
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            (um por linha — fica salvo neste aparelho)
          </span>
        </label>

        {students.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Users className="w-4 h-4 text-lumii-coral shrink-0" />
            <label htmlFor="sorteio-turma" className="text-xs text-muted-foreground shrink-0">
              Carregar minha turma:
            </label>
            <select
              id="sorteio-turma"
              defaultValue=""
              onChange={(e) => {
                carregarTurma(e.target.value);
                e.target.value = "";
              }}
              className="flex-1 min-w-0 text-sm rounded-lg border border-border bg-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
            >
              <option value="">Escolha…</option>
              <option value="__all__">Todos os meus alunos ({students.length})</option>
              {turmas.map((t) => (
                <option key={t} value={t}>
                  {t} ({students.filter((s) => s.classLabel === t).length})
                </option>
              ))}
            </select>
          </div>
        )}

        <textarea
          id="sorteio-nomes"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={5}
          placeholder={"Ana\nBruno\nCarla\nDavi\n…"}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40 resize-y"
        />
        <p className="text-xs text-muted-foreground">
          {nomes.length} {nomes.length === 1 ? "nome" : "nomes"}
        </p>
      </div>

      {/* Modo */}
      <div className="flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setModo("um")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            modo === "um" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4" />
          Sortear um
        </button>
        <button
          type="button"
          onClick={() => setModo("grupos")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            modo === "grupos" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" />
          Formar grupos
        </button>
      </div>

      {modo === "um" ? (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={naoRepetir}
              onChange={(e) => setNaoRepetir(e.target.checked)}
              className="w-4 h-4 rounded accent-lumii-coral"
            />
            Não repetir até todos serem sorteados
          </label>

          <div className="lumii-card p-8 sm:p-10 flex items-center justify-center min-h-[160px]">
            {todosSorteados ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">Todos já foram sorteados! 🎉</p>
                <button
                  type="button"
                  onClick={resetSorteio}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:border-lumii-coral hover:text-lumii-coral transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Recomeçar
                </button>
              </div>
            ) : current ? (
              <p
                className={`text-3xl sm:text-5xl font-black text-center break-words transition-all ${
                  rolling ? "opacity-60 scale-95 text-foreground/70" : "text-lumii-coral scale-100"
                }`}
              >
                {current}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Toque em sortear para escolher alguém da turma.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={sortearUm}
              disabled={rolling || nomes.length === 0 || todosSorteados}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[48px] disabled:opacity-50"
            >
              <Shuffle className="w-5 h-5" />
              {rolling ? "Sorteando…" : "Sortear"}
            </button>
            <button
              type="button"
              onClick={resetSorteio}
              disabled={pickedIdx.length === 0 && !current}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold border border-border hover:border-lumii-coral hover:text-lumii-coral transition-colors min-h-[48px] disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
              Zerar
            </button>
          </div>

          {naoRepetir && pickedIdx.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {pickedIdx.length} de {nomes.length} já sorteados
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setAgruparPor("quantidade")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  agruparPor === "quantidade" ? "bg-white text-lumii-coral shadow-sm" : "text-muted-foreground"
                }`}
              >
                Nº de grupos
              </button>
              <button
                type="button"
                onClick={() => setAgruparPor("tamanho")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  agruparPor === "tamanho" ? "bg-white text-lumii-coral shadow-sm" : "text-muted-foreground"
                }`}
              >
                Alunos por grupo
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              {agruparPor === "quantidade" ? "Quantos grupos" : "Quantos por grupo"}
              <input
                type="number"
                min={1}
                max={Math.max(1, nomes.length)}
                value={n}
                onChange={(e) => setN(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 rounded-lg border border-border bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={formarGrupos}
            disabled={nomes.length === 0}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[48px] disabled:opacity-50"
          >
            <Shuffle className="w-5 h-5" />
            Formar grupos
          </button>

          {grupos && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grupos.map((g, i) => (
                <div key={i} className="lumii-card p-4">
                  <p className="text-xs font-bold text-lumii-coral uppercase tracking-wide mb-2">
                    Grupo {i + 1}
                    <span className="ml-1.5 text-muted-foreground font-normal normal-case">
                      ({g.length})
                    </span>
                  </p>
                  <ul className="space-y-1">
                    {g.map((nome, j) => (
                      <li key={j} className="text-sm text-foreground/90">
                        {nome}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
