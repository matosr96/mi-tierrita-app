import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./FinanceScreen.module.css";

/** Simulación de un dial: valores que la API calculó (rejilla de sensibilidad) y valor que se está consultando. */
export type DialSimulation = {
  /** Valores de la rejilla de la API dentro del rango del dial, ordenados; null mientras no ha llegado. */
  values: number[] | null;
  /** Valor consultado ahora mismo; null = caso base. */
  current: number | null;
  format: (v: number) => string;
  /** Se llama al pasar el puntero o enfocar el dial: pide la serie a la API antes de arrastrar. */
  onArm: () => void;
  onChange: (value: number | null) => void;
};

type Props = {
  label: string;
  /** Valor del escenario ya formateado. */
  value: string;
  base: number;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  sim?: DialSimulation | undefined;
};

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

const nearestOf = (values: number[], v: number): number => values.reduce((best, x) => (Math.abs(x - v) < Math.abs(best - v) ? x : best), values[0] ?? v);

/**
 * Dial de un supuesto del escenario. Con `sim`, la perilla se arrastra (puntero o ← →, Inicio, Fin) y salta a los
 * valores que la API calculó; al soltar, al pulsar Escape o al salir del dial vuelve al valor del escenario.
 */
export const ScenarioDial = ({ label, value, base, min, max, minLabel, maxLabel, sim }: Props) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const current = sim?.current ?? null;
  const shown = current ?? base;
  const pos = clamp01((shown - min) / (max - min));
  const basePos = clamp01((base - min) / (max - min));

  if (!sim) {
    return (
      <div className={styles.dial}>
        <div className={styles.dialHead}>
          <span className={styles.dialLabel}>{label}</span>
          <strong className={styles.dialValue}>{value}</strong>
        </div>
        <div className={styles.track} role="img" aria-label={`${label}: ${value}`}>
          <span className={styles.trackFill} style={{ width: `${basePos * 100}%` }} />
          <span className={styles.thumb} style={{ left: `${basePos * 100}%` }} />
        </div>
        <div className={styles.dialRange}>
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
    );
  }

  const snap = (v: number): number => (sim.values && sim.values.length > 0 ? nearestOf(sim.values, v) : Math.min(max, Math.max(min, v)));
  const fromPointer = (e: PointerEvent) => {
    const box = trackRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    sim.onChange(snap(min + clamp01((e.clientX - box.left) / box.width) * (max - min)));
  };
  const release = () => {
    setDragging(false);
    sim.onChange(null);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      sim.onChange(null);
      return;
    }
    const grid = sim.values && sim.values.length > 0 ? sim.values : null;
    const from = current ?? base;
    const fine = (max - min) / 20;
    let next: number | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = grid ? (grid.find((x) => x > from + 1e-9) ?? grid[grid.length - 1]) : Math.min(max, from + fine);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = grid ? ([...grid].reverse().find((x) => x < from - 1e-9) ?? grid[0]) : Math.max(min, from - fine);
    else if (e.key === "Home") next = grid ? grid[0] : min;
    else if (e.key === "End") next = grid ? grid[grid.length - 1] : max;
    if (next === undefined) return;
    e.preventDefault();
    sim.onChange(next);
  };

  return (
    <div className={[styles.dial, styles.dialLive, current !== null ? styles.dialSimulating : ""].join(" ")} onPointerEnter={sim.onArm}>
      <div className={styles.dialHead}>
        <span className={styles.dialLabel}>{label}</span>
        <strong className={[styles.dialValue, current !== null ? styles.dialValueSim : ""].join(" ")}>{current !== null ? sim.format(current) : value}</strong>
      </div>
      <div
        ref={trackRef}
        className={styles.trackHit}
        role="slider"
        tabIndex={0}
        aria-label={`${label} (simulación; el escenario no se modifica)`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={shown}
        aria-valuetext={current !== null ? `${sim.format(current)}, simulado` : `${value}, valor del escenario`}
        onFocus={sim.onArm}
        onBlur={() => sim.onChange(null)}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          sim.onArm();
          fromPointer(e);
        }}
        onPointerMove={(e) => {
          if (dragging) fromPointer(e);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={() => {
          if (dragging) release();
        }}
      >
        <div className={[styles.track, dragging ? styles.trackDragging : ""].join(" ")}>
          <span className={styles.trackFill} style={{ width: `${pos * 100}%` }} />
          {current !== null ? <span className={styles.baseTick} style={{ left: `${basePos * 100}%` }} aria-hidden="true" /> : null}
          <span className={styles.thumb} style={{ left: `${pos * 100}%` }} />
        </div>
      </div>
      <div className={styles.dialRange}>
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
};
