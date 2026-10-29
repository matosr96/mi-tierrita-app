import styles from "./ReportPicker.module.css";

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

/** Tarjeta para ELEGIR un reporte (no es la portada impresa: esa es `ReportCoverPage`): título, descripción y a quién va dirigido. */
export const ReportPicker = ({ def, selected, onSelect }: { def: ReportDef; selected: boolean; onSelect: () => void }) => (
  <button type="button" className={[styles.picker, selected ? styles.selected : ""].join(" ")} aria-pressed={selected} onClick={onSelect}>
    <span className={styles.head}>
      <span className={styles.title}>
        {def.lead} {def.accent}
      </span>
      {selected ? (
        <svg className={styles.check} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3.5 8.4 6.5 11.2 12.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
    <span className={styles.text}>{def.text}</span>
    <span className={styles.foot}>
      {def.audience} · {def.cadence}
    </span>
  </button>
);
