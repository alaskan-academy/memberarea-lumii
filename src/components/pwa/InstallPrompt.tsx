"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

type Platform = "android" | "ios" | null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Permanente (localStorage) — aluna dispensou explicitamente, nunca mais mostrar.
const DISMISSED_KEY = "pwa-install-dismissed";
// Por sessão — evita reaparecer a cada navegação dentro da mesma visita.
const SHOWN_SESSION_KEY = "pwa-install-shown-session";

function isRunningAsPWA() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

async function isAlreadyInstalledElsewhere(): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if (typeof nav.getInstalledRelatedApps !== "function") return false;
    const related = await nav.getInstalledRelatedApps();
    return Array.isArray(related) && related.length > 0;
  } catch {
    return false;
  }
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return null;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>(null);
  const [visible, setVisible] = useState(false);
  const [iosStepsOpen, setIosStepsOpen] = useState(false);

  useEffect(() => {
    if (isRunningAsPWA()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (sessionStorage.getItem(SHOWN_SESSION_KEY)) return;

    let cancelled = false;
    let removeListener: (() => void) | undefined;

    function show() {
      sessionStorage.setItem(SHOWN_SESSION_KEY, "1");
      setVisible(true);
    }

    isAlreadyInstalledElsewhere().then((installed) => {
      if (installed || cancelled) return;

      const detected = detectPlatform();
      setPlatform(detected);

      // O evento beforeinstallprompt dispara UMA vez, cedo — o script no <head>
      // (layout.tsx: pwa-install-capture) o guarda em window.__pwaInstallPrompt
      // antes do React montar. Lemos de lá; um listener próprio aqui perderia o
      // evento e o botão de instalar nunca apareceria.
      const stashed = (window as unknown as { __pwaInstallPrompt?: BeforeInstallPromptEvent })
        .__pwaInstallPrompt;
      if (stashed) {
        setDeferredPrompt(stashed);
        show();
      }

      // Belt-and-suspenders: se disparar depois (ex.: condições de instalação
      // só satisfeitas mais tarde), também capturamos.
      function handleBeforeInstall(e: Event) {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        show();
      }
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      removeListener = () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);

      // iOS Safari não dispara o evento — mostra as instruções manuais.
      if (detected === "ios") show();
    });

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);

  // A altura da tarja vira uma variável CSS que o header e o sidebar descontam
  // (ver StudentHeader/StudentNav e o padding-top do layout). Sem isso, a tarja
  // fixa passaria por cima do header ao rolar.
  useEffect(() => {
    document.documentElement.style.setProperty("--install-bar-h", visible ? "52px" : "0px");
    return () => document.documentElement.style.setProperty("--install-bar-h", "0px");
  }, [visible]);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
    setIosStepsOpen(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISSED_KEY, "1");
      setVisible(false);
    }
    setDeferredPrompt(null);
  }

  if (!visible) return null;

  return (
    <>
      {/* Tarja não-bloqueante no topo (52px). Não tapa o conteúdo — o header e o
          sidebar descontam a altura via --install-bar-h. */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[52px] bg-lumii-bg-sidebar text-white flex items-center gap-2.5 px-3 sm:px-4 shadow-md">
        <Smartphone className="w-4 h-4 shrink-0 text-lumii-coral" />
        <p className="flex-1 min-w-0 text-xs sm:text-sm font-medium truncate">
          Instale o app Lumii — acesse direto da tela inicial
        </p>

        {platform !== "ios" && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-lumii-coral text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Instalar
          </button>
        )}

        {platform === "ios" && (
          <button
            onClick={() => setIosStepsOpen(true)}
            className="shrink-0 h-9 px-3 rounded-lg bg-lumii-coral text-white text-xs font-bold hover:opacity-90 transition-colors"
          >
            Como instalar
          </button>
        )}

        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="shrink-0 p-1.5 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Instruções do iOS — abertas por toque (não é o modal automático que tapava a tela). */}
      {iosStepsOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setIosStepsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Como instalar no iPhone"
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-border/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="brand-stripe"><span /><span /><span /></div>
            <div className="p-5 space-y-3">
              <p className="font-bold text-sm text-foreground">Como instalar no iPhone / iPad</p>
              <ol className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-lumii-coral shrink-0">1.</span>
                  Toque no botão <strong>Compartilhar</strong> <span className="inline-block">⬆</span> na barra do Safari
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-lumii-coral shrink-0">2.</span>
                  Role e toque em <strong>&quot;Adicionar à Tela de Início&quot;</strong>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-lumii-coral shrink-0">3.</span>
                  Toque em <strong>Adicionar</strong> no canto superior direito
                </li>
              </ol>
              <button
                onClick={() => setIosStepsOpen(false)}
                className="w-full py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
