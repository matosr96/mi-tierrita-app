import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { printElement } from "@/lib/print";
import { useRecordExport } from "@/hooks/reports";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { notify } from "@/stores/toasts";
import type { ExportData, ExportReportKind } from "@/types/api";
import { ReportCoverPage, type CoverInfo } from "./ReportCoverPage";
import { COVER_PHOTO } from "./coverPhoto";
import { ReportStampContext, type ReportStamp } from "./ReportStamp";
import styles from "./ReportPreview.module.css";

type Props = {
  subtitle: string;
  filters: ReactNode;
  /** Nombre base de los archivos exportados (sin extensión). Sin él no se ofrece exportar. */
  exportName?: string | undefined;
  /** Arma y guarda el libro de Excel con las filas del reporte; resuelve `false` si la persona canceló «Guardar como». */
  onExcel?: (() => Promise<boolean> | void) | undefined;
  /** Qué se registra en el historial al generar: tipo, descripción legible, filtros y resumen (folio y hash los pone la API). */
  record?: { report: ExportReportKind; description: string; filters: ExportData; summary: ExportData } | undefined;
  /** Datos de la portada del PDF (código, título, período y filtros). Sin ellos el PDF sale sin portada. */
  cover?: CoverInfo | undefined;
  children: ReactNode;
};

/** Espera a que la foto de la portada esté decodificada (está en caché si ya se abrió la página pública); tope de 1,5 s. */
const preloadCover = (): Promise<void> => {
  const img = new Image();
  img.src = COVER_PHOTO.src;
  return Promise.race([img.decode().catch(() => undefined), new Promise<void>((resolve) => setTimeout(resolve, 1500))]);
};

/**
 * Vista previa: barra blanca con filtros y exportación a PDF y Excel, y debajo el documento. Al pedir el PDF primero se
 * registra el documento (folio y hash de la API), luego se arma la portada con el QR y se abre el diálogo de impresión.
 */
export const ReportPreview = ({ subtitle, filters, exportName, onExcel, record, cover, children }: Props) => {
  const user = useSessionStore((s) => s.user);
  const recordExport = useRecordExport();
  const deskRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const [stamp, setStamp] = useState<ReportStamp>(null);
  const [printing, setPrinting] = useState<{ name: string; stamp: ReportStamp; withCover: boolean } | null>(null);
  const paper = () => deskRef.current?.querySelector<HTMLElement>("article") ?? null;
  const generatedBy = user ? `${user.firstName} ${user.lastName}, ${ROLE_LABELS[user.role]}` : "";

  const onPdf = async () => {
    if (!exportName) return;
    if (!record) {
      printElement(paper(), `${exportName}.pdf`);
      return;
    }
    let next: ReportStamp = null;
    try {
      const saved = await recordExport.mutateAsync({ ...record, format: "pdf" });
      next = { folio: saved.folio, verifyUrl: `${window.location.origin}/verificar/${saved.folio}`, createdAt: saved.createdAt, generatedBy };
    } catch {
      notify.error("No se pudo registrar el documento: el PDF sale sin folio ni QR.");
    }
    setStamp(next);
    setPrinting({ name: `${exportName}.pdf`, stamp: next, withCover: cover !== undefined });
  };

  // La portada y el folio ya están en el DOM: se imprime después de pintar.
  useEffect(() => {
    if (!printing) return;
    let cancelled = false;
    void preloadCover().then(() => {
      if (cancelled) return;
      printElement([printing.withCover ? coverRef.current : null, paper()], printing.name);
      setPrinting(null);
      setStamp(null);
    });
    return () => {
      cancelled = true;
    };
  }, [printing]);

  const onExcelClick = async () => {
    if (!onExcel) return;
    const saved = await onExcel();
    if (saved !== false && record) recordExport.mutate({ ...record, format: "xlsx" });
  };

  return (
    <ReportStampContext.Provider value={stamp}>
      <div className={styles.preview}>
        <div className={styles.bar} role="toolbar" aria-label="Parámetros del reporte">
          <span className={styles.tag}>Vista previa</span>
          <div className={styles.filters}>{filters}</div>
          {exportName ? (
            <div className={styles.actions}>
              <Button variant="secondary" size="sm" loading={recordExport.isPending || printing !== null} onClick={() => void onPdf()} title="Abre el diálogo de impresión: allí elija «Guardar como PDF» y la carpeta de destino">
                PDF
              </Button>
              {onExcel ? (
                <Button variant="secondary" size="sm" onClick={() => void onExcelClick()} title="Guardar como: elija la carpeta y el nombre del libro .xlsx">
                  Excel
                </Button>
              ) : null}
              <span className={styles.saveHint}>Guardar como: PDF desde el diálogo de impresión; Excel pregunta dónde guardarlo.</span>
            </div>
          ) : null}
        </div>
        <p className={styles.caption}>{subtitle}</p>
        <div ref={deskRef} className={styles.desk}>
          {children}
        </div>
        {cover ? (
          <div ref={coverRef} hidden aria-hidden="true">
            {printing ? <ReportCoverPage {...cover} generatedBy={generatedBy} generatedAt={printing.stamp?.createdAt ?? new Date().toISOString()} folio={printing.stamp?.folio} verifyUrl={printing.stamp?.verifyUrl} /> : null}
          </div>
        ) : null}
      </div>
    </ReportStampContext.Provider>
  );
};
