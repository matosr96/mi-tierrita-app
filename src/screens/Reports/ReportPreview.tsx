import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import styles from "./ReportsScreen.module.css";

type Props = { subtitle: string; filters: ReactNode; actions?: ReactNode; children: ReactNode };

/** Sección «Vista previa» del lienzo: título, subtítulo con el reporte y la fecha, filtros y el documento. */
export const ReportPreview = ({ subtitle, filters, actions, children }: Props) => (
  <Card title="Vista previa" subtitle={subtitle} actions={actions} className={styles.preview}>
    <div className={styles.filters}>{filters}</div>
    {children}
  </Card>
);
