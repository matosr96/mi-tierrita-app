import type { CSSProperties } from "react";
import styles from "./TopoField.module.css";

const STEPS = 120;

/** Curva de nivel cerrada: un círculo deformado con tres armónicos, distinto en cada anillo. */
const ring = (k: number, seed: number) => {
  const base = 40 + k * 26;
  const pts: string[] = [];
  for (let s = 0; s <= STEPS; s += 1) {
    const t = (s / STEPS) * Math.PI * 2;
    const r = base * (1 + 0.07 * Math.sin(3 * t + k * 0.45 + seed) + 0.04 * Math.sin(5 * t - k * 0.8) + 0.025 * Math.cos(7 * t + k + seed));
    pts.push(`${s === 0 ? "M" : "L"}${(500 + r * Math.cos(t)).toFixed(1)},${(500 + r * Math.sin(t) * 0.82).toFixed(1)}`);
  }
  return `${pts.join(" ")} Z`;
};

const cache = new Map<string, string[]>();
const paths = (rings: number, seed: number) => {
  const key = `${rings}:${seed}`;
  if (!cache.has(key)) cache.set(key, Array.from({ length: rings }, (_, k) => ring(k, seed)));
  return cache.get(key)!;
};

type Props = {
  className?: string;
  rings?: number;
  /** Anillo resaltado (o null para ninguno). */
  signal?: number | null;
  /** Desfase de la forma, para que dos campos no se vean iguales. */
  seed?: number;
};

/** Curvas de nivel que se dibujan una vez al montar; `signal` resalta uno de los anillos. Decorativo. */
export const TopoField = ({ className, rings = 16, signal = 9, seed = 0 }: Props) => (
  <svg className={[styles.topo, className ?? ""].join(" ")} viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    {paths(rings, seed).map((d, k) => (
      <g key={k} className={styles.ringGroup} style={{ "--k": k } as CSSProperties}>
        <path d={d} pathLength={1} className={[styles.ring, k === signal ? styles.ringHot : ""].join(" ")} />
      </g>
    ))}
  </svg>
);
