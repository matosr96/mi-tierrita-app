import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { SvgPoint } from "./useChartHover";
import styles from "./charts.module.css";

export type ChartTip = {
  /** Microetiqueta en mono (valor de X, nombre de la barra). */
  label: string;
  /** Cifra principal ya formateada. */
  value?: string;
  /** Filas adicionales nombre → cifra (por ejemplo, interés y capital). */
  rows?: { name: string; value: string }[];
};

type Props = {
  svgRef: RefObject<SVGSVGElement | null>;
  /** Punto del viewBox sobre el que flota la etiqueta; null la oculta. */
  anchor: SvgPoint | null;
  tip: ChartTip | null;
  children: ReactNode;
};

type Placement = { left: number; top: number; below: boolean };

const tipText = (tip: ChartTip | null): string => (tip ? [tip.label, tip.value, ...(tip.rows ?? []).map((r) => `${r.name} ${r.value}`)].filter(Boolean).join(", ") : "");

/** Envoltura del SVG con la etiqueta flotante oscura (vidrio) que acompaña al punto o barra activa. */
export const ChartFrame = ({ svgRef, anchor, tip, children }: Props) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Placement | null>(null);
  const text = tipText(tip);
  const ax = anchor?.x;
  const ay = anchor?.y;

  // Se mide después de pintar el contenido nuevo y antes de mostrarlo: la etiqueta nunca se sale del marco.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    const frame = frameRef.current;
    const ctm = svg?.getScreenCTM();
    if (ax === undefined || ay === undefined || !frame || !ctm || !text) {
      setPlace(null);
      return;
    }
    const p = new DOMPoint(ax, ay).matrixTransform(ctm);
    const box = frame.getBoundingClientRect();
    const half = (tipRef.current?.offsetWidth ?? 0) / 2;
    const h = tipRef.current?.offsetHeight ?? 44;
    const rawLeft = p.x - box.left;
    const left = box.width > half * 2 + 8 ? Math.min(Math.max(rawLeft, half + 4), box.width - half - 4) : box.width / 2;
    const top = p.y - box.top;
    setPlace({ left, top, below: top < h + 14 });
  }, [svgRef, ax, ay, text]);

  return (
    <div ref={frameRef} className={styles.frame}>
      {children}
      {tip ? (
        <div
          ref={tipRef}
          aria-hidden="true"
          className={[styles.tip, place ? styles.tipOn : "", place?.below ? styles.tipBelow : ""].join(" ")}
          style={place ? { left: place.left, top: place.top } : undefined}
        >
          <span className={styles.tipLabel}>{tip.label}</span>
          {tip.value ? <strong className={styles.tipValue}>{tip.value}</strong> : null}
          {tip.rows?.map((r) => (
            <span key={r.name} className={styles.tipRow}>
              <span>{r.name}</span>
              <b>{r.value}</b>
            </span>
          ))}
        </div>
      ) : null}
      <span className="sr-only" role="status" aria-live="polite">
        {text}
      </span>
    </div>
  );
};
