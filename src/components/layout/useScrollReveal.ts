import { useEffect, type RefObject } from "react";

const SELECTOR = "section, [data-reveal-item]";

/**
 * Bloques que montan fuera de la vista quedan ocultos (data-reveal="pending") y aparecen al entrar en pantalla.
 * Los que ya se ven al montar se quedan con su animación de entrada normal. Observa también lo que llega después
 * (datos que cargan), con un MutationObserver.
 */
export const useScrollReveal = (rootRef: RefObject<HTMLElement | null>, resetKey: string) => {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = "in";
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    const scan = () => {
      root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        if (el.dataset.reveal) return;
        // Un bloque dentro de otro que ya espera su turno aparece con él.
        if (el.parentElement?.closest('[data-reveal="pending"]')) return;
        if (el.closest('[role="dialog"]')) return;
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
          el.dataset.reveal = "seen";
          return;
        }
        el.dataset.reveal = "pending";
        io.observe(el);
      });
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [rootRef, resetKey]);
};
