import type { PointerEvent } from "react";

/** Guarda la posición del cursor dentro del elemento en --mx/--my para pintar un brillo que lo sigue. */
export const trackSpotlight = (e: PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};
