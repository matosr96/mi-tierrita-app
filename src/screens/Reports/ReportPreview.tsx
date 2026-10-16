import { useRef, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { printElement } from "@/lib/print";
import styles from "./ReportPreview.module.css";

type Props = {
  subtitle: string;
  filters: ReactNode;
  /** Nombre base de los archivos exportados (sin extensión). Sin él no se ofrece exportar. */
  exportName?: string | undefined;
  /** Arma y descarga el libro de Excel con las filas del reporte. */
  onExcel?: (() => void) | undefined;
  children: ReactNode;
};

/** Vista previa: barra de mando compacta (filtros y exportación a PDF y Excel) y el documento apoyado sobre el escritorio. */
export const ReportPreview = ({ subtitle, filters, exportName, onExcel, children }: Props) => {
  const deskRef = useRef<HTMLDivElement>(null);
  const paper = () => deskRef.current?.querySelector<HTMLElement>("article") ?? null;
  return (
    <div className={styles.preview}>
      <div className={styles.bar} role="toolbar" aria-label="Parámetros del reporte">
        <span className={styles.tag}>
          <span className={styles.dot} aria-hidden="true" />
          Vista previa
        </span>
        <div className={styles.filters}>{filters}</div>
        {exportName ? (
          <div className={styles.actions}>
            <Button variant="secondary" size="sm" onClick={() => printElement(paper(), `${exportName}.pdf`)}>
              PDF
            </Button>
            {onExcel ? (
              <Button variant="secondary" size="sm" onClick={onExcel}>
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
