import type { CSSProperties, PointerEvent } from "react";
import { trackSpotlight } from "@/components/motion";
import styles from "./ReportCover.module.css";

export type ReportKind = "sales" | "inventory" | "receivables";
export type ReportDef = {
  kind: ReportKind;
  code: string;
  lead: string;
  accent: string;
  text: string;
  audience: string;
  cadence: string;
  adminOnly: boolean;
};

const W = 320;
const H = 200;

/** Pseudoaleatorio estable (misma figura en cada render). */
const hash = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Ventas: columnas que crecen hacia la derecha y una línea de tendencia sobre sus topes. */
const salesBars = Array.from({ length: 22 }, (_, i) => {
  const h = 26 + i * 4.2 + 26 * Math.sin(i * 0.7) ** 2 + 14 * hash(i);
  return { x: 10 + i * 14, h: Math.min(h, H - 30) };
});
const salesTrend = salesBars.map((b, i) => `${i === 0 ? "M" : "L"}${(b.x + 4).toFixed(1)},${(H - b.h - 8).toFixed(1)}`).join(" ");

/** Inventario: matriz de cajas en perspectiva, unas llenas y otras vacías. */
const inventoryCells = Array.from({ length: 12 * 5 }, (_, k) => {
  const col = k % 12;
  const row = Math.floor(k / 12);
  const v = hash(k + 3);
  return { col, row, level: v > 0.78 ? 2 : v > 0.42 ? 1 : 0 };
});

/** Cartera: anillos de antigüedad desde la esquina, con marcas de días y un anillo vencido encendido. */
const receivableRings = Array.from({ length: 10 }, (_, k) => 34 + k * 22);
const arc = (r: number): string => `M ${W - r} ${H} A ${r} ${r} 0 0 1 ${W} ${H - r}`;
const ticks = Array.from({ length: 13 }, (_, k) => {
  const a = Math.PI + (k / 12) * (Math.PI / 2);
  const r1 = 244;
  const r2 = k % 3 === 0 ? 232 : 238;
  return { x1: W + r1 * Math.cos(a), y1: H + r1 * Math.sin(a), x2: W + r2 * Math.cos(a), y2: H + r2 * Math.sin(a) };
});

const CoverPattern = ({ kind }: { kind: ReportKind }) => (
  <svg className={styles.pattern} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
    {kind === "sales" ? (
      <g>
        {salesBars.map((b, i) => (
          <rect key={i} x={b.x} y={H - b.h} width={8} height={b.h} rx={1.5} className={styles.bar} style={{ "--i": i, "--o": 0.1 + (i / salesBars.length) * 0.38 } as CSSProperties} />
        ))}
        <path d={salesTrend} pathLength={1} className={styles.trend} />
      </g>
    ) : null}
    {kind === "inventory" ? (
      <g transform="translate(96 88) skewX(-28) scale(1 0.86)">
        {inventoryCells.map((c) => (
          <rect
            key={`${c.col}-${c.row}`}
            x={c.col * 20}
            y={c.row * 22}
            width={14}
            height={14}
            rx={2}
            className={c.level === 2 ? styles.cellHot : c.level === 1 ? styles.cellFull : styles.cellEmpty}
            style={{ "--i": c.col + c.row } as CSSProperties}
          />
        ))}
      </g>
    ) : null}
    {kind === "receivables" ? (
      <g>
        {receivableRings.map((r, k) => (
          <path key={r} d={arc(r)} pathLength={1} className={k === 6 ? styles.ringHot : styles.ring} style={{ "--i": k } as CSSProperties} />
        ))}
        {ticks.map((t, k) => (
          <line key={k} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className={styles.tick} />
        ))}
      </g>
    ) : null}
  </svg>
);

const tilt = (e: PointerEvent<HTMLButtonElement>) => {
  trackSpotlight(e);
  const r = e.currentTarget.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  e.currentTarget.style.setProperty("--ry", `${(px * 9).toFixed(2)}deg`);
  e.currentTarget.style.setProperty("--rx", `${(-py * 7).toFixed(2)}deg`);
};
const untilt = (e: PointerEvent<HTMLButtonElement>) => {
  e.currentTarget.style.setProperty("--ry", "0deg");
  e.currentTarget.style.setProperty("--rx", "0deg");
};

/** Portada oscura de un reporte: código y destinatario en mono, título ligero con acento serif y un patrón propio. */
export const ReportCover = ({ def, index, selected, onSelect }: { def: ReportDef; index: number; selected: boolean; onSelect: () => void }) => (
  <button
    type="button"
    className={[styles.cover, selected ? styles.selected : ""].join(" ")}
    style={{ "--n": index } as CSSProperties}
    aria-pressed={selected}
    onClick={onSelect}
    onPointerMove={tilt}
    onPointerLeave={untilt}
  >
    <CoverPattern kind={def.kind} />
    <span className={styles.shade} aria-hidden="true" />
    <span className={styles.spine} aria-hidden="true" />

    <span className={styles.top}>
      <span className={styles.code}>{def.code}</span>
      <span className={styles.audience}>{def.audience}</span>
    </span>

    <span className={styles.title}>
      {def.lead} <em>{def.accent}</em>
    </span>
    <span className={styles.text}>{def.text}</span>

    <span className={styles.foot}>
      <span className={styles.cadence}>{def.cadence}</span>
      <span className={styles.cta}>
        {selected ? "En vista previa" : "Ver vista previa"}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          {selected ? (
            <path d="M3 7.4 5.8 10 11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </span>
    </span>
  </button>
);
