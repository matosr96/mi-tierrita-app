import type { ReactNode } from "react";
import styles from "./ReportsScreen.module.css";

export type Indicator = { label: string; value: string; tone?: "good" | "warn" | "bad" };
export type Param = { label: string; value: string };

type Props = {
  title: string;
  meta: string;
  /** Párrafos de la conclusión, redactados solo con cifras que devolvió la API. */
  summary: ReactNode;
  params: Param[];
  indicators: Indicator[];
  note?: string;
  children: ReactNode;
};

const toneClass = (tone: Indicator["tone"]): string => (tone === "good" ? styles.indicatorGood : tone === "warn" ? styles.indicatorWarn : tone === "bad" ? styles.indicatorBad : undefined) ?? "";

/**
 * Documento de la vista previa del lienzo: encabezado con línea bosque, columna principal
 * (conclusión, parámetros y bloques) y aparte de 232px con los indicadores y la nota.
 */
export const ReportPaper = ({ title, meta, summary, params, indicators, note, children }: Props) => (
  <div className={styles.paper}>
    <div className={styles.paperHead}>
      <h3>{title}</h3>
      <div className={styles.paperMeta}>{meta}</div>
    </div>
    <div className={styles.paperBody}>
      <div className={styles.paperMain}>
        <div>
          <div className={styles.sectionLabel}>Conclusión</div>
          {summary}
        </div>
        <div>
          <div className={styles.sectionLabel}>Parámetros usados</div>
          <div className={styles.params}>
            {params.map((p) => (
              <div key={p.label} className={styles.param}>
                <span className={styles.paramLabel}>{p.label}</span>
                <span className={styles.paramValue}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
        {children}
      </div>
      <div className={styles.paperAside}>
        <div className={styles.sectionLabel}>Indicadores</div>
        <div className={styles.indicators}>
          {indicators.map((i) => (
            <div key={i.label} className={[styles.indicator, toneClass(i.tone)].join(" ")}>
              <span className={styles.indicatorLabel}>{i.label}</span>
              <strong>{i.value}</strong>
            </div>
          ))}
        </div>
        {note ? <div className={styles.note}>{note}</div> : null}
      </div>
    </div>
  </div>
);
