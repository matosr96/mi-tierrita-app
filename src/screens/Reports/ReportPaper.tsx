import type { ReactNode } from "react";
import { BrandMark } from "@/components/layout/AppShell";
import styles from "./ReportPaper.module.css";

export type Indicator = { label: string; value: string; tone?: "good" | "warn" | "bad" };
export type Param = { label: string; value: string };

type Props = {
  /** Código del documento (R-01…). */
  code: string;
  /** Titular en dos partes: «Reporte de» + acento en serif cursiva. */
  title: string;
  accent: string;
  /** Datos de emisión (rango, fecha de corte, quién lo genera), uno por renglón de la línea de metadatos. */
  meta: string[];
  /** Párrafos de la conclusión, redactados solo con cifras que devolvió la API. */
  summary: ReactNode;
  params: Param[];
  indicators: Indicator[];
  note?: string;
  children: ReactNode;
};

const toneClass = (tone: Indicator["tone"]): string => (tone === "good" ? styles.good : tone === "warn" ? styles.warn : tone === "bad" ? styles.bad : undefined) ?? "";

/**
 * Documento impreso de la vista previa: membrete, titular con doble regla, metadatos en mono, secciones numeradas,
 * aparte de indicadores como libro mayor y pie de página. Las hojas de atrás y las marcas de corte dan el tacto de papel.
 */
export const ReportPaper = ({ code, title, accent, meta, summary, params, indicators, note, children }: Props) => (
  <article className={styles.paper} aria-label={`${title} ${accent}`}>
    <span className={[styles.crop, styles.tl].join(" ")} aria-hidden="true" />
    <span className={[styles.crop, styles.tr].join(" ")} aria-hidden="true" />
    <span className={[styles.crop, styles.bl].join(" ")} aria-hidden="true" />
    <span className={[styles.crop, styles.br].join(" ")} aria-hidden="true" />

    <header className={styles.head}>
      <div className={styles.letterhead}>
        <span className={styles.brand}>
          <BrandMark size={22} />
          Agropecuaria Mi Tierrita
        </span>
        <span className={styles.code}>Documento {code}</span>
      </div>
      <h3 className={styles.title}>
        {title} <em>{accent}</em>
      </h3>
      <ul className={styles.meta}>
        {meta.filter(Boolean).map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </header>

    <div className={styles.body}>
      <div className={styles.main}>
        <div className={styles.block}>
          <h4 className={styles.sectionLabel}>Conclusión</h4>
          <div className={styles.summary}>{summary}</div>
        </div>
        <div className={styles.block}>
          <h4 className={styles.sectionLabel}>Parámetros usados</h4>
          <dl className={styles.params}>
            {params.map((p) => (
              <div key={p.label} className={styles.param}>
                <dt>{p.label}</dt>
                <dd>{p.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {children}
      </div>

      <aside className={styles.aside}>
        <h4 className={styles.asideLabel}>Indicadores</h4>
        <dl className={styles.ledger}>
          {indicators.map((i) => (
            <div key={i.label} className={[styles.entry, toneClass(i.tone)].join(" ")}>
              <dt>{i.label}</dt>
              <span className={styles.leader} aria-hidden="true" />
              <dd>{i.value}</dd>
            </div>
          ))}
        </dl>
        {note ? <p className={styles.note}>{note}</p> : null}
      </aside>
    </div>

    <footer className={styles.foot}>
      <span>Mi Tierrita SIG · {code}</span>
      <span>Hoja 1</span>
    </footer>
  </article>
);
