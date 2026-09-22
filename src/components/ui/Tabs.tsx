import styles from "./Tabs.module.css";

export type TabOption<T extends string> = { value: T; label: string };

/** Control segmentado (pestañas de una pantalla). */
export const Tabs = <T extends string>({ options, value, onChange }: { options: TabOption<T>[]; value: T; onChange: (v: T) => void }) => (
  <div className={styles.tabs} role="tablist">
    {options.map((o) => (
      <button key={o.value} type="button" role="tab" aria-selected={o.value === value} className={[styles.tab, o.value === value ? styles.active : ""].join(" ")} onClick={() => onChange(o.value)}>
        {o.label}
      </button>
    ))}
  </div>
);

/** Filtros tipo chip (por ejemplo, categorías). */
export const Chips = <T extends string | number>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) => (
  <div className={styles.chips}>
    {options.map((o) => (
      <button key={String(o.value)} type="button" className={[styles.chip, o.value === value ? styles.chipActive : ""].join(" ")} onClick={() => onChange(o.value)}>
        {o.label}
      </button>
    ))}
  </div>
);
