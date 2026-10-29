import { Link, useParams } from "react-router-dom";
import { BrandMark } from "@/components/layout/AppShell";
import { Callout, Loading } from "@/components/ui";
import { useVerifyExport } from "@/hooks/reports";
import { dateOnly, dateTime, int, money, num2, pct } from "@/lib/format";
import type { ExportData, ExportReportKind } from "@/types/api";
import styles from "./VerifyScreen.module.css";

const REPORT_LABEL: Record<ExportReportKind, string> = { sales: "Reporte de ventas", inventory: "Reporte de inventario", receivables: "Reporte de cartera", scenario: "Escenario financiero" };

/** Nombres legibles de filtros y cifras del resumen que guarda la API. */
const LABELS: Record<string, { label: string; value?: (v: string | number | boolean | null) => string }> = {
  from: { label: "Desde", value: (v) => dateOnly(String(v)) },
  to: { label: "Hasta", value: (v) => dateOnly(String(v)) },
  groupBy: { label: "Agrupación", value: (v) => (v === "product" ? "por producto" : "por día") },
  days: { label: "Ventana de vencimiento", value: (v) => `${int(Number(v))} días` },
  overdueDays: { label: "Vencida a", value: (v) => `${int(Number(v))} días` },
  asOf: { label: "Corte", value: (v) => dateOnly(String(v)) },
  scenarioId: { label: "Escenario", value: (v) => `#${String(v)}` },
  projectId: { label: "Proyecto del simulador", value: (v) => (v === null ? "sin guardar" : `#${String(v)}`) },
  npv: { label: "VPN", value: (v) => money(Number(v)) },
  irr: { label: "TIR", value: (v) => (v === null ? "—" : pct(Number(v))) },
  paybackSimple: { label: "Recuperación", value: (v) => (v === null ? "no se recupera" : `${num2(Number(v))} años`) },
  benefitCostRatio: { label: "Beneficio / costo", value: (v) => num2(Number(v)) },
  price: { label: "Precio de venta", value: (v) => money(Number(v)) },
  growth: { label: "Crecimiento de la demanda", value: (v) => pct(Number(v)) },
  salesCount: { label: "Ventas", value: (v) => int(Number(v)) },
  units: { label: "Unidades", value: (v) => int(Number(v)) },
  total: { label: "Total vendido", value: (v) => money(Number(v)) },
  cashTotal: { label: "De contado", value: (v) => money(Number(v)) },
  creditTotal: { label: "A crédito", value: (v) => money(Number(v)) },
  activeProducts: { label: "Productos activos", value: (v) => int(Number(v)) },
  costValue: { label: "Valor al costo", value: (v) => money(Number(v)) },
  saleValue: { label: "Valor a precio de venta", value: (v) => money(Number(v)) },
  outOfStock: { label: "Sin stock", value: (v) => int(Number(v)) },
  expiringBatches: { label: "Lotes por vencer", value: (v) => int(Number(v)) },
  expiredBatches: { label: "Lotes vencidos", value: (v) => int(Number(v)) },
  customersWithBalance: { label: "Clientes con saldo", value: (v) => int(Number(v)) },
  totalBalance: { label: "Cartera total", value: (v) => money(Number(v)) },
  overdueCustomers: { label: "Clientes vencidos", value: (v) => int(Number(v)) },
  overdueBalance: { label: "Cartera vencida", value: (v) => money(Number(v)) },
};

const ORDER = Object.keys(LABELS);
const byKnownOrder = ([a]: [string, unknown], [b]: [string, unknown]) => (ORDER.indexOf(a) === -1 ? 99 : ORDER.indexOf(a)) - (ORDER.indexOf(b) === -1 ? 99 : ORDER.indexOf(b));

const Rows = ({ data }: { data: ExportData }) => (
  <dl className={styles.rows}>
    {Object.entries(data).sort(byKnownOrder).map(([k, v]) => {
      const def = LABELS[k];
      const text = v === null ? "—" : typeof v === "boolean" ? (v ? "sí" : "no") : def?.value ? def.value(v) : String(v);
      return (
        <div key={k}>
          <dt>{def?.label ?? k}</dt>
          <dd>{text}</dd>
        </div>
      );
    })}
  </dl>
);

/**
 * Página pública `/verificar/:folio` (sin sesión): a donde lleva el QR de la portada. Consulta `GET /reports/verify/:folio`
 * y muestra «Documento auténtico» con los datos de emisión, o «No encontrado».
 */
export const VerifyScreen = () => {
  const { folio = "" } = useParams<{ folio: string }>();
  const query = useVerifyExport(folio);
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <header className={styles.brand}>
          <BrandMark size={34} />
          <span>
            <strong>Mi Tierrita</strong>
            <span>Verificación de documentos</span>
          </span>
        </header>
        <p className={styles.folio}>
          Folio <b>{folio}</b>
        </p>
        {query.isPending ? (
          <Loading text="Consultando el documento…" />
        ) : query.isError || !query.data ? (
          <Callout tone="bad" title="No encontrado">
            <p className={styles.verdict}>Ningún documento del sistema tiene ese folio. Compruebe que el código escaneado esté completo o pida el documento de nuevo.</p>
          </Callout>
        ) : (
          <>
            <Callout tone="good" title="Documento auténtico">
              <p className={styles.verdict}>
                {REPORT_LABEL[query.data.report]} en {query.data.format === "pdf" ? "PDF" : "Excel"}, generado por @{query.data.generatedBy} el {dateTime(query.data.createdAt)}
              </p>
            </Callout>
            <section className={styles.section}>
              <h2>Emisión</h2>
              <dl className={styles.rows}>
                <div>
                  <dt>Documento</dt>
                  <dd>{REPORT_LABEL[query.data.report]}</dd>
                </div>
                <div>
                  <dt>Descripción</dt>
                  <dd>{query.data.description}</dd>
                </div>
                <div>
                  <dt>Formato</dt>
                  <dd>{query.data.format === "pdf" ? "PDF" : "Excel"}</dd>
                </div>
                <div>
                  <dt>Generado por</dt>
                  <dd>@{query.data.generatedBy}</dd>
                </div>
                <div>
                  <dt>Fecha y hora</dt>
                  <dd>{dateTime(query.data.createdAt)}</dd>
                </div>
              </dl>
            </section>
            {Object.keys(query.data.filters).length > 0 ? (
              <section className={styles.section}>
                <h2>Filtros con los que se generó</h2>
                <Rows data={query.data.filters} />
              </section>
            ) : null}
            {Object.keys(query.data.summary).length > 0 ? (
              <section className={styles.section}>
                <h2>Cifras del documento</h2>
                <Rows data={query.data.summary} />
              </section>
            ) : null}
            {query.data.hash ? (
              <p className={styles.hash}>
                Huella sha256: <code>{query.data.hash}</code>
              </p>
            ) : null}
          </>
        )}
        <footer className={styles.foot}>
          <Link to="/sitio">Mi Tierrita</Link>
          <span>Sistema de información de la tienda</span>
        </footer>
      </div>
    </main>
  );
};
