import styles from "./charts.module.css";

export type ChartTone = "accent" | "soft" | "forest" | "good" | "warn" | "bad" | "muted";
export type LegendItem = { key: string; label: string; tone: ChartTone; hidden?: boolean };

type Props = {
  items: LegendItem[];
  /** Con `onToggle` cada entrada es un botón que muestra u oculta su serie (`aria-pressed` = visible). */
  onToggle?: ((key: string) => void) | undefined;
  /** Nombre accesible de la leyenda. */
  label?: string;
};

/** Leyenda compartida por las gráficas: muestra de color y nombre; clicable cuando la gráfica deja ocultar series. */
export const Legend = ({ items, onToggle, label = "Series de la gráfica" }: Props) => (
  <ul className={styles.legend} aria-label={label}>
    {items.map((it) => (
      <li key={it.key}>
        {onToggle ? (
          <button type="button" className={[styles.legendButton, it.hidden ? styles.legendOff : ""].join(" ")} aria-pressed={!it.hidden} onClick={() => onToggle(it.key)} title={it.hidden ? `Mostrar ${it.label}` : `Ocultar ${it.label}`}>
            <i className={styles[`tone_${it.tone}`]} aria-hidden="true" />
            <span>{it.label}</span>
          </button>
        ) : (
          <span className={styles.legendStatic}>
            <i className={styles[`tone_${it.tone}`]} aria-hidden="true" />
            <span>{it.label}</span>
          </span>
        )}
      </li>
    ))}
  </ul>
);
