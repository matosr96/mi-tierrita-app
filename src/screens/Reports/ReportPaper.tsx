import type { ReactNode } from "react";
import { BrandMark } from "@/components/layout/AppShell";
import { useReportStamp } from "./ReportStamp";
import styles from "./ReportPaper.module.css";

export type Indicator = { label: string; value: string; tone?: "good" | "warn" | "bad" };
export type Param = { label: string; value: string };

type Props = {
  /** Código del documento (R-01…). */
  code: string;
  /** Titular en dos partes («Reporte de» + «ventas»); se leen como un solo título. */
  title: string;
  accent: string;
  /** Datos de emisión (rango, fecha de corte, quién lo genera), uno por renglón de la línea de metadatos. */
  meta: string[];
  /** Párrafos de la conclusión, redactados solo con cifras que devolvió la API. */
  summary: ReactNode;
  params: Param[];
  indicators: Indicator[];
  note?: string;
  /** Folio del documento ya registrado (se conoce al generar el PDF); en la vista previa aún no hay. */
  folio?: string | undefined;
  children: ReactNode;
};

const toneClass = (tone: Indicator["tone"]): string => (tone === "good" ? styles.good : tone === "warn" ? styles.warn : tone === "bad" ? styles.bad : undefined) ?? "";

/**
 * Documento de la vista previa (y del PDF, que clona este <article>): membrete, título, datos de emisión, secciones,
 * columna de indicadores como libro mayor y pie de página. Hoja A4 blanca y sobria.
 */
export const ReportPaper = ({ code, title, accent, meta, summary, params, indicators, note, folio: folioProp, children }: Props) => {
  const stamp = useReportStamp();
  const folio = folioProp ?? stamp?.folio;
  return (
  <article className={styles.paper} aria-label={`${title} ${accent}`}>

    <header className={styles.head}>
      <div className={styles.letterhead}>
        <span className={styles.brand}>
          <BrandMark size={22} />
          Agropecuaria Mi Tierrita
        </span>
        <span className={styles.code}>Documento {code}</span>
      </div>
      <h3 className={styles.title}>
        {title} {accent}
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
      <span>{folio ? `Folio ${folio} · verificable con el QR de la portada` : "Vista previa · el folio y el QR se asignan al generar el PDF"}</span>
    </footer>
  </article>
  );
};
