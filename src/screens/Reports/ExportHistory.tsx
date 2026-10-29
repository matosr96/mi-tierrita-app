import { useState } from "react";
import { Badge, Button, Card, DataTable, EmptyState, Pagination, QueryState, type Column } from "@/components/ui";
import { useReportExports } from "@/hooks/reports";
import { dateOnly, dateTime, int } from "@/lib/format";
import type { ExportData, ExportReportKind, ReportExport } from "@/types/api";
import styles from "./ReportsScreen.module.css";

const REPORT_LABEL: Record<ExportReportKind, string> = { sales: "Reporte de ventas", inventory: "Reporte de inventario", receivables: "Reporte de cartera", scenario: "Escenario financiero" };

/** Nombre legible de cada filtro guardado y cómo mostrar su valor. */
const FILTER_LABEL: Record<string, { label: string; value?: (v: string | number | boolean | null) => string }> = {
  from: { label: "Desde", value: (v) => dateOnly(String(v)) },
  to: { label: "Hasta", value: (v) => dateOnly(String(v)) },
  groupBy: { label: "Agrupación", value: (v) => (v === "product" ? "por producto" : "por día") },
  days: { label: "Ventana de vencimiento", value: (v) => `${int(Number(v))} días` },
  overdueDays: { label: "Vencida a", value: (v) => `${int(Number(v))} días` },
  asOf: { label: "Corte", value: (v) => dateOnly(String(v)) },
  scenarioId: { label: "Escenario", value: (v) => `#${String(v)}` },
};

const filterText = (key: string, value: ExportData[string]): { label: string; text: string } => {
  const def = FILTER_LABEL[key];
  const text = value === null ? "—" : typeof value === "boolean" ? (value ? "sí" : "no") : String(value);
  return { label: def?.label ?? key, text: def?.value ? def.value(value) : text };
};

/** Filtros estructurados del documento en texto legible («Desde 1/10/2026 · Hasta 29/10/2026 · Agrupación por día»). */
const ORDER = Object.keys(FILTER_LABEL);
const byKnownOrder = ([a]: [string, unknown], [b]: [string, unknown]) => (ORDER.indexOf(a) === -1 ? 99 : ORDER.indexOf(a)) - (ORDER.indexOf(b) === -1 ? 99 : ORDER.indexOf(b));

const Filters = ({ filters, fallback }: { filters: ExportData; fallback: string }) => {
  const entries = Object.entries(filters).sort(byKnownOrder);
  if (entries.length === 0) return <span className={styles.historyFilters}>{fallback}</span>;
  return (
    <span className={styles.historyFilters}>
      {entries.map(([k, v]) => {
        const f = filterText(k, v);
        return (
          <span key={k}>
            {f.label} <b>{f.text}</b>
          </span>
        );
      })}
    </span>
  );
};

const openVerification = (folio: string) => window.open(`/verificar/${folio}`, "_blank", "noopener");

const columns: Column<ReportExport>[] = [
  { key: "date", header: "Fecha y hora", render: (e) => dateTime(e.createdAt) },
  {
    key: "report",
    header: "Reporte y filtros",
    align: "left",
    render: (e) => (
      <span className={styles.historyReport}>
        <strong>{REPORT_LABEL[e.report]}</strong>
        <Filters filters={e.filters} fallback={e.description} />
      </span>
    ),
  },
  { key: "format", header: "Formato", align: "left", render: (e) => <Badge tone={e.format === "pdf" ? "bad" : "good"}>{e.format === "pdf" ? "PDF" : "Excel"}</Badge> },
  { key: "user", header: "Generado por", align: "left", render: (e) => `@${e.username}` },
  { key: "folio", header: "Folio", align: "left", render: (e) => <span className={styles.folio}>{e.folio}</span> },
  {
    key: "verify",
    header: "",
    align: "right",
    render: (e) => (
      <Button variant="ghost" size="sm" onClick={() => openVerification(e.folio)} title="Abre la página pública de verificación de este documento">
        Verificar
      </Button>
    ),
  },
];

/** Historial de documentos generados (prototipo 09 + brief 2.4): fecha y hora, reporte, formato, quién, folio y filtros. */
export const ExportHistory = ({ isAdmin }: { isAdmin: boolean }) => {
  const [page, setPage] = useState(1);
  const query = useReportExports({ page, limit: 8 });
  return (
    <Card title="Historial de reportes generados" subtitle={isAdmin ? "Cada PDF o Excel generado por el equipo, con la hora exacta, sus filtros y su folio. También queda en Auditoría." : "Los reportes que usted ha generado, con sus filtros y su folio."}>
      <QueryState query={query} isEmpty={(p) => p.items.length === 0} empty={<EmptyState title="Aún no se ha generado ningún reporte" text="Cuando alguien genere un PDF o un Excel aparecerá aquí con su folio." />}>
        {(p) => (
          <>
            <DataTable columns={columns} rows={p.items} rowKey={(e) => e.id} />
            <Pagination page={p} onPage={setPage} />
          </>
        )}
      </QueryState>
    </Card>
  );
};
