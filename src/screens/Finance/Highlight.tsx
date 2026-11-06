import type { ReactNode } from "react";
import styles from "./FinanceScreen.module.css";

export type HighlightItem = { label: string; value: ReactNode; hint?: ReactNode; tone?: "good" | "bad" | "warn" };
const toneClass = (t: HighlightItem["tone"]): string => (t === "good" ? styles.good : t === "bad" ? styles.bad : t === "warn" ? styles.warn : undefined) ?? "";

/** El único resultado destacado de la pestaña (una cifra grande; dos cuando van juntas, como VPN y TIR). */
export const Highlight = ({ items, note }: { items: HighlightItem[]; note?: ReactNode }) => (
  <section className={styles.highlight} aria-label="Resultado de la sección">
    <dl className={styles.highlightGrid}>
      {items.map((i) => (
        <div key={i.label} className={styles.highlightItem}>
          <dt>{i.label}</dt>
          <dd className={toneClass(i.tone)}>{i.value}</dd>
          {i.hint ? <span className={styles.highlightHint}>{i.hint}</span> : null}
        </div>
      ))}
    </dl>
    {note ? <p className={styles.highlightNote}>{note}</p> : null}
  </section>
);
