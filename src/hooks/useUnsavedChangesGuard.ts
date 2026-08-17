"use client";

import { useEffect } from "react";

/**
 * Registra um listener nativo `beforeunload` que dispara o diálogo padrão do
 * navegador ("Sair do site? As alterações feitas podem não ser salvas.")
 * sempre que `dirty` for `true` no momento em que a aba/janela for fechada
 * ou recarregada. O texto do diálogo não é customizável em browsers
 * modernos — isso é esperado e uma das poucas exceções legítimas para usar
 * um mecanismo nativo do browser em vez de UI própria.
 *
 * Não cobre navegação *dentro* do app via Next Router (ex: clicar num
 * `<Link>` para outra página do admin) — apenas fechar/recarregar a aba.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Navegadores modernos ignoram o texto customizado, mas returnValue
      // precisa ser setado para o diálogo nativo aparecer em todos eles.
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);
}
