import { useEffect } from "react";

const FOCUSABLE =
  'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * A11y de diálogo modal: ao abrir, move o foco para dentro (1º campo focável, ou
 * o próprio container); fecha no Escape; e prende o Tab dentro do diálogo. O ref
 * deve apontar para o elemento com role="dialog" (com tabIndex={-1} como fallback
 * de foco). Restaura o foco pro elemento que abriu o diálogo ao fechar.
 *
 * `active` deve refletir o estado aberto do diálogo. Os modais aqui ficam sempre
 * montados e só fazem `if (!open) return null`, então o efeito precisa reagir ao
 * `open` — passar `active={open}` garante que o foco entre ao abrir e seja
 * restaurado ao fechar.
 */
export function useDialogA11y(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  active = true
) {
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const first = el.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? el).focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && el) {
        const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (nodes.length === 0) return;
        const firstNode = nodes[0];
        const lastNode = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === firstNode) {
          e.preventDefault();
          lastNode.focus();
        } else if (!e.shiftKey && document.activeElement === lastNode) {
          e.preventDefault();
          firstNode.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Devolve o foco pro elemento que abriu o diálogo (APG). Obs.: nos modais
      // que usam useModalBackGuard isso acaba sobreposto — o history.back() do
      // guard dispara um popstate que reseta o foco pro body depois daqui, então
      // na prática o foco não volta pro gatilho nesses casos. É intencional
      // (trade-off do back-guard mobile) e inofensivo; em reusos sem back-guard
      // a restauração funciona normalmente.
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [ref, onClose, active]);
}
