import { Badge, Button, DataTable, type Column } from "@/components/ui";
import { money } from "@/lib/format";
import type { PayrollEmployee } from "@/types/api";
import { FREQUENCY_LABELS } from "./payrollLabels";
import styles from "./PayrollScreen.module.css";

type Props = {
  employees: PayrollEmployee[];
  onEdit: (employee: PayrollEmployee) => void;
  onToggleActive: (employee: PayrollEmployee) => void;
  busyId: number | null;
};

/** Empleados de nómina: nombre y documento, cargo, salario mensual pactado, frecuencia, estado y acciones. */
export const EmployeeList = ({ employees, onEdit, onToggleActive, busyId }: Props) => {
  const columns: Column<PayrollEmployee>[] = [
    {
      key: "name",
      header: "Empleado",
      render: (e) => (
        <div className={styles.who}>
          <span className={[styles.name, e.active ? "" : styles.inactive].join(" ")}>
            {e.firstName} {e.lastName}
          </span>
          <span className={styles.code}>{e.documentId}</span>
        </div>
      ),
    },
    { key: "position", header: "Cargo", render: (e) => e.position },
    { key: "salary", header: "Salario mensual", align: "right", render: (e) => <span className={styles.num}>{money(e.baseSalary)}</span> },
    { key: "frequency", header: "Pago", render: (e) => FREQUENCY_LABELS[e.payFrequency] },
    { key: "status", header: "Estado", render: (e) => <Badge tone={e.active ? "good" : "neutral"}>{e.active ? "Activo" : "Inactivo"}</Badge> },
    {
      key: "actions",
      header: <span className={styles.srOnly}>Acciones</span>,
      label: "",
      align: "right",
      render: (e) => (
        <div className={styles.rowActions}>
          <Button variant="ghost" size="sm" onClick={() => onEdit(e)} aria-label={`Editar a ${e.firstName} ${e.lastName}`}>
            Editar
          </Button>
          <Button variant="secondary" size="sm" loading={busyId === e.id} onClick={() => onToggleActive(e)} aria-label={`${e.active ? "Desactivar" : "Activar"} a ${e.firstName} ${e.lastName}`}>
            {e.active ? "Desactivar" : "Activar"}
          </Button>
        </div>
      ),
    },
  ];
  return (
    <div className={styles.frame}>
      <DataTable columns={columns} rows={employees} rowKey={(e) => e.id} />
    </div>
  );
};
