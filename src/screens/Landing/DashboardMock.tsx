import type { CSSProperties } from "react";
import { BrandMark } from "@/components/layout/AppShell";
import styles from "./DashboardMock.module.css";

/** Barras finas de un minigráfico (alturas en %, solo de ejemplo). */
export const MiniBars = ({ values, tone = "sprout", className }: { values: number[]; tone?: "sprout" | "warn" | "bad"; className?: string }) => (
  <span className={[styles.bars, styles[tone], className ?? ""].join(" ")} aria-hidden="true">
    {values.map((v, i) => (
      <i key={i} style={{ "--h": `${v}%`, "--i": i } as CSSProperties} />
    ))}
  </span>
);

const KPIS = [
  { label: "Ventas del mes", value: "$ 18,4 M", hint: "vs. mes anterior", bars: [38, 52, 44, 61, 57, 70, 66, 82], tone: "sprout" as const },
  { label: "Lotes por vencer", value: "7", hint: "próximos 30 días", bars: [20, 34, 28, 46, 40, 30, 52, 44], tone: "warn" as const },
  { label: "Cartera vencida", value: "$ 2,1 M", hint: "más de 30 días", bars: [64, 58, 60, 48, 52, 40, 36, 30], tone: "bad" as const },
  { label: "Clientes a crédito", value: "42", hint: "con cupo activo", bars: [30, 36, 40, 44, 50, 54, 58, 62], tone: "sprout" as const },
];

const ROWS = [
  { name: "Vacuna aftosa", lot: "Lote 24", tag: "12 días", tone: "warn" },
  { name: "Concentrado lechero 40 kg", lot: "Lote 31", tag: "2 meses", tone: "good" },
  { name: "Desparasitante oral", lot: "Lote 19", tag: "Vencido", tone: "bad" },
] as const;

const WEEK = [46, 58, 52, 74, 66, 88, 70];

/**
 * Pantalla ilustrativa del Inicio del sistema, hecha con divs (no es una captura ni muestra datos reales).
 * Todo se dimensiona en `em` sobre una letra base que depende del ancho del marco, así escala como una imagen.
 */
export const DashboardMock = () => (
  <div className={styles.frame} aria-hidden="true">
    <div className={styles.chrome}>
      <span className={styles.dots}>
        <i />
        <i />
        <i />
      </span>
      <span className={styles.url}>mitierrita · inicio</span>
    </div>
    <div className={styles.screen}>
      <div className={styles.head}>
        <div className={styles.topbar}>
          <span className={styles.brand}>
            <BrandMark size={18} />
            Mi Tierrita
          </span>
          <span className={styles.pill}>
            <b>Inicio</b>
            <span>Ventas</span>
            <span>Inventario</span>
            <span>Cartera</span>
            <span>Reportes</span>
          </span>
          <span className={styles.avatar}>MT</span>
        </div>
        <div className={styles.greeting}>
          <strong>Buenos días, equipo</strong>
          <span>Esto es lo que pasa hoy en la tienda.</span>
        </div>
      </div>
      <div className={styles.kpis}>
        {KPIS.map((k, i) => (
          <div key={k.label} className={styles.kpi} style={{ "--i": i } as CSSProperties}>
            <span className={styles.kpiLabel}>{k.label}</span>
            <strong className={styles.kpiValue}>{k.value}</strong>
            <span className={styles.kpiFoot}>
              <small>{k.hint}</small>
              <MiniBars values={k.bars} tone={k.tone} />
            </span>
          </div>
        ))}
      </div>
      <div className={styles.lower}>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Próximos vencimientos</span>
          <ul className={styles.list}>
            {ROWS.map((r) => (
              <li key={r.name}>
                <span className={styles.rowDot} data-tone={r.tone} />
                <span className={styles.rowName}>
                  {r.name}
                  <small>{r.lot}</small>
                </span>
                <span className={styles.tag} data-tone={r.tone}>
                  {r.tag}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Ventas por día</span>
          <div className={styles.week}>
            {WEEK.map((v, i) => (
              <span key={i} style={{ "--h": `${v}%`, "--i": i } as CSSProperties}>
                <i />
                <small>{["L", "M", "M", "J", "V", "S", "D"][i]}</small>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
