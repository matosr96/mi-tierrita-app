import { BrandMark } from "@/components/layout/AppShell";
import { QrCode } from "@/components/ui";
import { dateTime } from "@/lib/format";
import type { Param } from "./ReportPaper";
import { COVER_PHOTO } from "./coverPhoto";
import styles from "./ReportCoverPage.module.css";

export type CoverInfo = {
  /** Código del documento (R-01…). */
  code: string;
  /** Titular en dos partes («Reporte de» + «ventas»). */
  title: string;
  accent: string;
  /** Período o fecha de corte, en una línea. */
  period: string;
  /** Filtros con los que se generó. */
  params: Param[];
};

type Props = CoverInfo & {
  generatedBy: string;
  /** ISO de emisión (la fecha que registró la API). */
  generatedAt: string;
  /** Folio y enlace de verificación; sin ellos (no se pudo registrar) la portada lo dice. */
  folio?: string | undefined;
  verifyUrl?: string | undefined;
};

/**
 * Portada del PDF (primera página impresa): foto, marca, título, período y filtros, quién lo generó y cuándo, folio y
 * QR que lleva a `/verificar/:folio`. En pantalla no se ve: `ReportPreview` la mantiene `hidden` y `printElement` la
 * muestra en la copia que se imprime.
 */
export const ReportCoverPage = ({ code, title, accent, period, params, generatedBy, generatedAt, folio, verifyUrl }: Props) => (
  <section className={styles.cover} data-print-cover="" aria-label="Portada del documento">
    <div className={styles.photo}>
      <img src={COVER_PHOTO.src} alt="Manos que sostienen tierra" width={1440} height={1172} />
    </div>
    <header className={styles.brand}>
      <BrandMark size={28} />
      <span>
        <strong>Mi Tierrita</strong>
        <span>Agropecuaria · Documento {code}</span>
      </span>
    </header>
    <h2 className={styles.title}>
      {title} <em>{accent}</em>
    </h2>
    <p className={styles.period}>{period}</p>
    <dl className={styles.params}>
      {params.map((p) => (
        <div key={p.label}>
          <dt>{p.label}</dt>
          <dd>{p.value}</dd>
        </div>
      ))}
    </dl>
    <div className={styles.issue}>
      <div className={styles.issueText}>
        <p>
          Generado por <strong>{generatedBy}</strong> el {dateTime(generatedAt)}
        </p>
        {folio ? (
          <>
            <p className={styles.folio}>
              Folio <strong>{folio}</strong>
            </p>
            <p className={styles.verifyHint}>Escanee el código o abra {verifyUrl} para comprobar que este documento lo emitió el sistema.</p>
          </>
        ) : (
          <p className={styles.verifyHint}>Sin folio: el documento no quedó registrado en el historial del sistema y no es verificable.</p>
        )}
      </div>
      {folio && verifyUrl ? (
        <div className={styles.qr}>
          <QrCode value={verifyUrl} size={120} label={`Código QR de verificación del folio ${folio}`} />
        </div>
      ) : null}
    </div>
    <footer className={styles.foot}>
      <span>Mi Tierrita SIG · {code}</span>
      <span className={styles.credit}>{COVER_PHOTO.credit}</span>
    </footer>
  </section>
);
