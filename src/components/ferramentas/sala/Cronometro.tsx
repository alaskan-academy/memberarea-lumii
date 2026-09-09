"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Timer, Clock } from "lucide-react";
import { CRONOMETRO_PRESETS } from "@/lib/ferramentas/sala/content";

type Modo = "regressivo" | "cronometro";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatar(ms: number, ceil: boolean): string {
  const totalSec = ceil ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const R = 120;
const C = 2 * Math.PI * R;

export default function Cronometro() {
  const [modo, setModo] = useState<Modo>("regressivo");
  const [durationSec, setDurationSec] = useState(300);
  const [remaining, setRemaining] = useState(300_000);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [alarming, setAlarming] = useState(false);

  const deadlineRef = useRef(0);
  const startAtRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);

  function ensureAudio() {
    try {
      if (!audioRef.current) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioRef.current = new AC();
      }
      if (audioRef.current.state === "suspended") audioRef.current.resume();
    } catch {
      /* sem áudio, tudo bem — o alerta visual continua */
    }
  }

  function beep() {
    const ctx = audioRef.current;
    if (!ctx) return;
    try {
      [0, 0.32, 0.64].forEach((t) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = "sine";
        o.frequency.value = 880;
        const at = ctx.currentTime + t;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
        o.start(at);
        o.stop(at + 0.3);
      });
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (modo === "regressivo") {
        const rem = Math.max(0, deadlineRef.current - Date.now());
        setRemaining(rem);
        if (rem <= 0) {
          setRunning(false);
          setAlarming(true);
          beep();
        }
      } else {
        setElapsed(Date.now() - startAtRef.current);
      }
    }, 100);
    return () => clearInterval(id);
  }, [running, modo]);

  function start() {
    ensureAudio();
    if (modo === "regressivo") {
      if (remaining <= 0) return;
      deadlineRef.current = Date.now() + remaining;
    } else {
      startAtRef.current = Date.now() - elapsed;
    }
    setAlarming(false);
    setRunning(true);
  }

  function pause() {
    if (modo === "regressivo") {
      setRemaining(Math.max(0, deadlineRef.current - Date.now()));
    } else {
      setElapsed(Date.now() - startAtRef.current);
    }
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setAlarming(false);
    if (modo === "regressivo") setRemaining(durationSec * 1000);
    else setElapsed(0);
  }

  function aplicarPreset(sec: number) {
    setRunning(false);
    setAlarming(false);
    setDurationSec(sec);
    setRemaining(sec * 1000);
  }

  function trocarModo(m: Modo) {
    setRunning(false);
    setAlarming(false);
    setModo(m);
  }

  function ajustarCustom(minutos: number, segundos: number) {
    const sec = Math.max(0, Math.min(minutos, 599)) * 60 + Math.max(0, Math.min(segundos, 59));
    setDurationSec(sec);
    setRemaining(sec * 1000);
    setRunning(false);
    setAlarming(false);
  }

  const valorMs = modo === "regressivo" ? remaining : elapsed;
  const fraction =
    modo === "regressivo"
      ? durationSec > 0
        ? remaining / (durationSec * 1000)
        : 0
      : (elapsed % 60_000) / 60_000;
  const perto = modo === "regressivo" && remaining > 0 && remaining <= 10_000;
  // Cor do anel via atributo SVG (não passa pelo Tailwind → hex é o correto aqui).
  const corRing = alarming || perto ? "#ef4444" : "#f6614f";

  const minInput = Math.floor(durationSec / 60);
  const secInput = durationSec % 60;

  return (
    <div className="space-y-5">
      {/* Modo */}
      <div className="flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => trocarModo("regressivo")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            modo === "regressivo" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Timer className="w-4 h-4" />
          Regressivo
        </button>
        <button
          type="button"
          onClick={() => trocarModo("cronometro")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            modo === "cronometro" ? "border-lumii-coral text-lumii-coral" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          Cronômetro
        </button>
      </div>

      {/* Ring + tempo */}
      <div className={`flex justify-center py-2 ${alarming ? "animate-pulse" : ""}`}>
        <div className="relative w-[280px] h-[280px]">
          <svg viewBox="0 0 280 280" className="w-full h-full -rotate-90">
            <circle cx="140" cy="140" r={R} fill="none" stroke="currentColor" className="text-muted/40" strokeWidth="12" />
            <circle
              cx="140"
              cy="140"
              r={R}
              fill="none"
              stroke={corRing}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - Math.max(0, Math.min(1, fraction)))}
              style={{ transition: running ? "stroke-dashoffset 0.15s linear" : "none" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-black tabular-nums ${valorMs >= 3_600_000 ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl"} ${
                alarming ? "text-red-500" : perto ? "text-red-500" : "text-foreground"
              }`}
            >
              {formatar(valorMs, modo === "regressivo")}
            </span>
            {alarming && <span className="text-sm font-semibold text-red-500 mt-1">Tempo!</span>}
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
        {running ? (
          <button
            type="button"
            onClick={pause}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[48px]"
          >
            <Pause className="w-5 h-5" />
            Pausar
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={modo === "regressivo" && remaining <= 0}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-lumii-coral hover:bg-[#e2543f] transition-colors min-h-[48px] disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
            Iniciar
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold border border-border hover:border-lumii-coral hover:text-lumii-coral transition-colors min-h-[48px]"
        >
          <RotateCcw className="w-4 h-4" />
          Zerar
        </button>
      </div>

      {/* Presets + custom (só no regressivo) */}
      {modo === "regressivo" && (
        <div className="space-y-3">
          <div className="flex flex-wrap justify-center gap-1.5">
            {CRONOMETRO_PRESETS.map((p) => (
              <button
                key={p.seconds}
                type="button"
                onClick={() => aplicarPreset(p.seconds)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  durationSec === p.seconds && !running ? "bg-lumii-coral text-white" : "bg-muted/60 text-foreground/70 hover:bg-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Personalizado:</span>
            <input
              type="number"
              min={0}
              max={599}
              value={minInput}
              onChange={(e) => ajustarCustom(Number(e.target.value) || 0, secInput)}
              className="w-16 rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
              aria-label="Minutos"
            />
            <span>min</span>
            <input
              type="number"
              min={0}
              max={59}
              value={secInput}
              onChange={(e) => ajustarCustom(minInput, Number(e.target.value) || 0)}
              className="w-16 rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-lumii-coral/40"
              aria-label="Segundos"
            />
            <span>s</span>
          </div>
        </div>
      )}
    </div>
  );
}
