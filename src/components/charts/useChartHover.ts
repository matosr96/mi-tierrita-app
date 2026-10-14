import { useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from "react";

export type SvgPoint = { x: number; y: number };

/** Punto del puntero (coordenadas de pantalla) llevado al sistema del viewBox del SVG. */
const clientToSvg = (svg: SVGSVGElement | null, clientX: number, clientY: number): SvgPoint | null => {
  const ctm = svg?.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
};

/**
 * Lectura interactiva de un gráfico SVG: índice del elemento activo (punto o barra) y referencia al SVG para
 * ubicar la etiqueta flotante. Con el ratón se limpia al salir; en pantallas táctiles queda hasta tocar fuera.
 */
export const useChartHover = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [active, setActive] = useState<number | null>(null);

  /** Props para cada barra (o grupo enfocable): pasar el puntero, tocar o tabular la activa. */
  const itemProps = (i: number) => ({
    tabIndex: 0,
    onPointerEnter: () => setActive(i),
    onPointerDown: () => setActive(i),
    onPointerLeave: (e: PointerEvent) => {
      if (e.pointerType !== "touch") setActive((a) => (a === i ? null : a));
    },
    onFocus: () => setActive(i),
    onBlur: (e: FocusEvent) => {
      if (!e.relatedTarget || !svgRef.current?.contains(e.relatedTarget as Node)) setActive(null);
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    },
    "data-on": active === i ? "" : undefined,
  });

  return { svgRef, active, setActive, itemProps };
};

/**
 * Lectura de una serie continua: la línea vertical salta al punto más cercano en X. Se recorre con el puntero
 * (arrastre horizontal en táctil) o con el teclado (← → Inicio Fin; Escape oculta) sobre el SVG enfocable.
 */
export const useLineScrub = (xs: number[], initial = 0) => {
  const hover = useChartHover();
  const { svgRef, setActive } = hover;

  const nearest = (x: number): number => {
    let best = 0;
    xs.forEach((v, i) => {
      if (Math.abs(v - x) < Math.abs((xs[best] ?? Infinity) - x)) best = i;
    });
    return best;
  };
  const fromPointer = (e: PointerEvent) => {
    const p = clientToSvg(svgRef.current, e.clientX, e.clientY);
    if (p && xs.length > 0) setActive(nearest(p.x));
  };
  const last = xs.length - 1;

  const svgProps = {
    ref: svgRef,
    tabIndex: 0,
    onPointerMove: fromPointer,
    onPointerDown: fromPointer,
    onPointerLeave: (e: PointerEvent) => {
      if (e.pointerType !== "touch") setActive(null);
    },
    onFocus: () => setActive((a) => a ?? Math.min(Math.max(initial, 0), last)),
    onBlur: () => setActive(null),
    onKeyDown: (e: KeyboardEvent) => {
      const move: Record<string, (a: number) => number> = {
        ArrowRight: (a) => Math.min(a + 1, last),
        ArrowUp: (a) => Math.min(a + 1, last),
        ArrowLeft: (a) => Math.max(a - 1, 0),
        ArrowDown: (a) => Math.max(a - 1, 0),
        Home: () => 0,
        End: () => last,
      };
      if (e.key === "Escape") {
        setActive(null);
        return;
      }
      const fn = move[e.key];
      if (!fn) return;
      e.preventDefault();
      setActive((a) => fn(a ?? initial));
    },
  };

  return { ...hover, svgProps };
};
