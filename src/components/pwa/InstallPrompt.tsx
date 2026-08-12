"use client";

import { useEffect, useState } from "react";
import { useModalBackGuard } from "@/hooks/useModalBackGuard";
import { Download, X, Smartphone } from "lucide-react";

type Platform = "android" | "ios" | null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Permanente (localStorage) — aluna dispensou explicitamente, nunca mais mostrar.
const DISMISSED_KEY = "pwa-install-dismissed";
// Por sessão (sessionStorage, some ao fechar a aba/app) — evita mostrar de novo
// a cada navegação dentro da mesma visita/login, mesmo sem dispensa explícita.
const SHOWN_SESSION_KEY = "pwa-install-shown-session";

function isRunningAsPWA() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

// Checagem extra de instalação prévia (Chrome/Android com suporte à API) — não
// existe equivalente no iOS Safari, que nunca expõe se o app já foi instalado
// fora do contexto de ter sido aberto pelo ícone (isRunningAsPWA já cobre isso).
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
  useModalBackGuard(visible, () => setVisible(false));

  useEffect(() => {
    if (isRunningAsPWA()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (sessionStorage.getItem(SHOWN_SESSION_KEY)) return;

    let cancelled = false;
    let removeListener: (() => void) | undefined;

    function show() {
      // Marca como mostrado já ao exibir, não só ao dispensar — se a aluna só
      // fechar a aba sem clicar em nada, não volta a aparecer na mesma sessão.
      sessionStorage.setItem(SHOWN_SESSION_KEY, "1");
      setVisible(true);
    }

    isAlreadyInstalledElsewhere().then((installed) => {
      if (installed || cancelled) return;

      const detected = detectPlatform();
      setPlatform(detected);

      function handleBeforeInstall(e: Event) {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        show();
      }

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      removeListener = () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);

      if (detected === "ios") show();
    });

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Instalar aplicativo"
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-border/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Faixa tricolor */}
        <div className="brand-stripe"><span /><span /><span /></div>

        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#f6614f]/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-[#f6614f]" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">Instale o app Lumii</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Acesse seus cursos direto da tela inicial, sem abrir o navegador.
              </p>
            </div>

            <button
              onClick={dismiss}
              aria-label="Fechar"
              className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0 -mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Android / Chrome */}
          {platform !== "ios" && deferredPrompt && (
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f6614f] text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                Instalar aplicativo
              </button>
              <button
                onClick={dismiss}
                className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                Depois
              </button>
            </div>
          )}

          {/* iOS Safari */}
          {platform === "ios" && (
            <>
              <div className="bg-[#F5F5F0] rounded-xl px-3 py-3 space-y-2 mb-3">
                <p className="text-xs font-semibold text-foreground/80">Como instalar no iPhone / iPad:</p>
                <ol className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#f6614f] shrink-0">1.</span>
                    Toque no botão <strong>Compartilhar</strong> <span className="inline-block">⬆</span> na barra do Safari
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#f6614f] shrink-0">2.</span>
                    Role e toque em <strong>"Adicionar à Tela de Início"</strong>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#f6614f] shrink-0">3.</span>
                    Toque em <strong>Adicionar</strong> no canto superior direito
                  </li>
                </ol>
              </div>
              <button
                onClick={dismiss}
                className="w-full py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                Entendido
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
