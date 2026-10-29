import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePayrollEmployees, usePayrollPeriods, useUpdatePayrollEmployee } from "@/hooks/payroll";
import { int } from "@/lib/format";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Chips, EmptyState, Pagination, QueryState, Tabs } from "@/components/ui";
import type { PayrollEmployee, PayrollStatus } from "@/types/api";
import { PayrollNotice } from "./PayrollNotice";
import { PeriodList } from "./PeriodList";
import { PeriodDetail } from "./PeriodDetail";
import { PeriodFormModal } from "./PeriodFormModal";
import { EmployeeList } from "./EmployeeList";
import { EmployeeFormModal } from "./EmployeeFormModal";
import { STATUS_LABELS } from "./payrollLabels";
import styles from "./PayrollScreen.module.css";

type Tab = "periods" | "employees";
type StatusFilter = PayrollStatus | "all";
type ActiveFilter = "active" | "inactive" | "all";

const TABS: { value: Tab; label: string }[] = [
  { value: "periods", label: "Periodos" },
  { value: "employees", label: "Empleados" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  ...(Object.keys(STATUS_LABELS) as PayrollStatus[]).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

const ACTIVE_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
  { value: "all", label: "Todos" },
];

/**
 * Nómina simplificada (solo Administrador). `?periodo=<id>` abre el detalle de un periodo (lo usan el calendario y
 * los avisos); `?pestana=empleados` abre la lista de empleados. Cifras y totales salen de la API.
 */
export const PayrollScreen = () => {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("pestana") === "empleados" ? "employees" : "periods";
  const periodParam = Number(params.get("periodo"));
  const openPeriodId = Number.isInteger(periodParam) && periodParam > 0 ? periodParam : null;

  const [status, setStatus] = useState<StatusFilter>("all");
  const [periodPage, setPeriodPage] = useState(1);
  const [active, setActive] = useState<ActiveFilter>("active");
  const [employeePage, setEmployeePage] = useState(1);
  const [periodForm, setPeriodForm] = useState(false);
  const [employeeForm, setEmployeeForm] = useState<{ open: boolean; employee: PayrollEmployee | null }>({ open: false, employee: null });
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const periods = usePayrollPeriods({ page: periodPage, limit: 20, ...(status === "all" ? {} : { status }) });
  const employees = usePayrollEmployees({ page: employeePage, limit: 20, ...(active === "all" ? {} : { active: active === "active" }) });
  const activeEmployees = usePayrollEmployees({ limit: 1, active: true });
  const toggle = useUpdatePayrollEmployee();

  const go = (next: { tab?: Tab; period?: number | null }) => {
    const p = new URLSearchParams();
    if ((next.tab ?? tab) === "employees") p.set("pestana", "empleados");
    if (next.period) p.set("periodo", String(next.period));
    setParams(p);
  };

  const toggleActive = async (employee: PayrollEmployee) => {
    setTogglingId(employee.id);
    try {
      await toggle.mutateAsync({ id: employee.id, active: !employee.active });
    } catch {
      /* se avisa abajo */
    } finally {
      setTogglingId(null);
    }
  };

  const openCreateEmployee = () => setEmployeeForm({ open: true, employee: null });
  const hasActive = (activeEmployees.data?.count ?? 0) > 0;

  return (
    <div className={styles.page}>
      <PageHeader
        title="Nómina"
        subtitle="Empleados y periodos de pago mensuales o quincenales. La liquidación y los totales los calcula el servidor."
        actions={
          tab === "periods" ? (
            <Button onClick={() => setPeriodForm(true)}>Nuevo periodo</Button>
          ) : (
            <Button onClick={openCreateEmployee}>Nuevo empleado</Button>
          )
        }
      />

      <PayrollNotice />

      <Tabs options={TABS} value={tab} onChange={(t) => go({ tab: t, period: null })} ariaLabel="Secciones de nómina" />

      {toggle.error ? <p className={styles.errorText} role="alert">{toggle.error.message}</p> : null}

      {tab === "periods" ? (
        openPeriodId !== null ? (
          <PeriodDetail key={openPeriodId} periodId={openPeriodId} onBack={() => go({ period: null })} />
        ) : (
          <section className={styles.section} aria-labelledby="payroll-periods-title">
            <header className={styles.head}>
              <div className={styles.headTitle}>
                <h2 id="payroll-periods-title">Periodos</h2>
                <span className={styles.headCount}>{periods.data ? `${int(periods.data.count)} ${periods.data.count === 1 ? "periodo" : "periodos"}` : "…"}</span>
              </div>
              <Chips
                options={STATUS_OPTIONS}
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setPeriodPage(1);
                }}
              />
            </header>
            <QueryState
              query={periods}
              isEmpty={(d) => d.items.length === 0}
              empty={
                <EmptyState
                  title={status === "all" ? "Aún no hay periodos de nómina" : `No hay periodos en estado «${STATUS_LABELS[status].toLowerCase()}»`}
                  text={hasActive ? "Cree el primer periodo: se arma con todos los empleados activos de la frecuencia." : "Primero registre a los empleados en la pestaña «Empleados»."}
                  action={
                    status !== "all" ? undefined : hasActive ? (
                      <Button onClick={() => setPeriodForm(true)}>Nuevo periodo</Button>
                    ) : (
                      <Button onClick={() => go({ tab: "employees" })}>Ir a empleados</Button>
                    )
                  }
                />
              }
            >
              {(d) => (
                <>
                  <PeriodList periods={d.items} onOpen={(p) => go({ period: p.id })} />
                  <Pagination page={d} onPage={setPeriodPage} />
                </>
              )}
            </QueryState>
          </section>
        )
      ) : (
        <section className={styles.section} aria-labelledby="payroll-employees-title">
          <header className={styles.head}>
            <div className={styles.headTitle}>
              <h2 id="payroll-employees-title">Empleados</h2>
              <span className={styles.headCount}>{employees.data ? `${int(employees.data.count)} ${employees.data.count === 1 ? "empleado" : "empleados"}` : "…"}</span>
            </div>
            <Chips
              options={ACTIVE_OPTIONS}
              value={active}
              onChange={(v) => {
                setActive(v);
                setEmployeePage(1);
              }}
            />
          </header>
          <QueryState
            query={employees}
            isEmpty={(d) => d.items.length === 0}
            empty={
              <EmptyState
                title={active === "inactive" ? "Ningún empleado está inactivo" : "Aún no hay empleados"}
                text={active === "inactive" ? undefined : "Registre a las personas a quienes la tienda les paga nómina."}
                action={active === "inactive" ? undefined : <Button onClick={openCreateEmployee}>Nuevo empleado</Button>}
              />
            }
          >
            {(d) => (
              <>
                <EmployeeList employees={d.items} onEdit={(e) => setEmployeeForm({ open: true, employee: e })} onToggleActive={toggleActive} busyId={togglingId} />
                <Pagination page={d} onPage={setEmployeePage} />
              </>
            )}
          </QueryState>
        </section>
      )}

      <div className={styles.overlays}>
        {periodForm ? (
          <PeriodFormModal
            onClose={() => setPeriodForm(false)}
            onCreated={(id) => {
              setPeriodForm(false);
              go({ tab: "periods", period: id });
            }}
          />
        ) : null}
        {employeeForm.open ? <EmployeeFormModal employee={employeeForm.employee} onClose={() => setEmployeeForm({ open: false, employee: null })} /> : null}
      </div>
    </div>
  );
};
