import { useRef, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { printElement } from "@/lib/print";
import { useRecordExport } from "@/hooks/reports";
import type { ExportFormat, ExportReportKind } from "@/types/api";
import styles from "./ReportPreview.module.css";

type Props = {
  subtitle: string;
  filters: ReactNode;
  /** Nombre base de los archivos exportados (sin extensión). Sin él no se ofrece exportar. */
  exportName?: string | undefined;
  /** Arma y descarga el libro de Excel con las filas del reporte. */
  onExcel?: (() => void) | undefined;
  /** Qué se registra en el historial de reportes al descargar (tipo y descripción legible). */
  record?: { report: ExportReportKind; description: string } | undefined;
  children: ReactNode;
};

/** Vista previa: barra de mando compacta (filtros y exportación a PDF y Excel) y el documento apoyado sobre el escritorio. */
export const ReportPreview = ({
  subtitle,
  filters,
  exportName,
  onExcel,
  record,
  children,
}: Props) => {
  const recordExport = useRecordExport();
  const logged = (format: ExportFormat) => {
    if (record) recordExport.mutate({ ...record, format });
  };
  const deskRef = useRef<HTMLDivElement>(null);
  const paper = () =>
    deskRef.current?.querySelector<HTMLElement>("article") ?? null;
  return (
    <div className={styles.preview}>
      <div
        className={styles.bar}
        role="toolbar"
        aria-label="Parámetros del reporte"
      >
        <span className={styles.tag}>
          <span className={styles.dot} aria-hidden="true" />
          Vista previa
        </span>
        <div className={styles.filters}>{filters}</div>
        {exportName ? (
          <div className={styles.actions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                printElement(paper(), `${exportName}.pdf`);
                logged("pdf");
              }}
            >
              PDF
            </Button>
            {onExcel ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onExcel();
                  logged("xlsx");
                }}
              >
                Excel
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className={styles.caption}>{subtitle}</p>
      <div ref={deskRef} className={styles.desk}>
        {children}
      </div>
    </div>
  );
};
