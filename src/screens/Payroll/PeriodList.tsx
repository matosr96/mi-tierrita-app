import { Badge, DataTable, type Column } from "@/components/ui";
import { dateOnly, int, money } from "@/lib/format";
import type { PayrollPeriod } from "@/types/api";
import { FREQUENCY_LABELS, STATUS_LABELS, STATUS_TONES } from "./payrollLabels";
import styles from "./PayrollScreen.module.css";

type Props = { periods: PayrollPeriod[]; onOpen: (period: PayrollPeriod) => void };

/** Periodos de nómina; tocar una fila abre su detalle. Cifras tal como las devuelve la API. */
export const PeriodList = ({ periods, onOpen }: Props) => {
  const columns: Column<PayrollPeriod>[] = [
    {
      key: "period",
      header: "Periodo",
      render: (p) => (
        <div className={styles.who}>
          <span className={styles.name}>
            {dateOnly(p.periodStart)} – {dateOnly(p.periodEnd)}
          </span>
          <span className={styles.sub}>{FREQUENCY_LABELS[p.frequency]}</span>
        </div>
      ),
    },
    { key: "payDate", header: "Fecha de pago", render: (p) => dateOnly(p.payDate) },
    { key: "employees", header: "Empleados", align: "right", render: (p) => int(p.employeeCount) },
    { key: "net", header: "Neto a pagar", align: "right", render: (p) => <span className={styles.num}>{money(p.totalNet)}</span> },
    { key: "status", header: "Estado", render: (p) => <Badge tone={STATUS_TONES[p.status]}>{STATUS_LABELS[p.status]}</Badge> },
  ];
  return (
    <div className={styles.frame}>
      <DataTable columns={columns} rows={periods} rowKey={(p) => p.id} onRowClick={onOpen} />
    </div>
  );
};
