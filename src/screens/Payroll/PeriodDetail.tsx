import { useState } from "react";
import { useApprovePayrollPeriod, useDeletePayrollPeriod, usePayPayrollPeriod, usePayrollPeriod, useUpdatePayrollLine } from "@/hooks/payroll";
import { dateOnly, dateTime, int, money } from "@/lib/format";
import { downloadXlsx, type XlsxCell } from "@/lib/xlsx";
import { Badge, Button, DataTable, Modal, QueryState, StatCard, StatGrid, EmptyState, type Column } from "@/components/ui";
import type { PayrollLine, PayrollPeriodDetail, UpdatePayrollLineInput } from "@/types/api";
import { LineAmountInput } from "./LineAmountInput";
import { FREQUENCY_LABELS, STATUS_LABELS, STATUS_TONES, personName } from "./payrollLabels";
import styles from "./PayrollScreen.module.css";

type Props = { periodId: number; onBack: () => void };

type Confirm = "approve" | "pay" | "delete" | null;

const TRANSPORT_HINT = "El auxilio de transporte se toma del decreto vigente; escríbalo solo si aplica a la persona (por defecto 0). No cotiza a salud ni pensión.";

const CONFIRM_TEXT: Record<Exclude<Confirm, null>, { title: string; text: string; action: string }> = {
  approve: { title: "Aprobar periodo", text: "Después de aprobarlo ya no podrá editar las líneas ni eliminarlo.", action: "Aprobar" },
  pay: { title: "Marcar como pagado", text: "Queda registrado quién lo marcó y cuándo. El sistema no mueve dinero ni reporta a la DIAN.", action: "Marcar pagado" },
  delete: { title: "Eliminar borrador", text: "Se eliminan el periodo y todas sus líneas. Esta acción no se puede deshacer.", action: "Eliminar borrador" },
};

const periodTitle = (p: PayrollPeriodDetail): string => `Nómina ${FREQUENCY_LABELS[p.frequency].toLowerCase()} del ${dateOnly(p.periodStart)} al ${dateOnly(p.periodEnd)}`;

/** Serializa a Excel solo lo que devolvió la API (líneas y totales del periodo). */
const exportPeriod = (p: PayrollPeriodDetail) => {
  const rows: XlsxCell[][] = p.lines.map((l) => [
    `${l.employee.firstName} ${l.employee.lastName}`,
    l.employee.documentId,
    l.employee.position,
    l.base,
    l.overtime,
    l.bonuses,
    l.transport,
    l.gross,
    l.health,
    l.pension,
    l.otherDeductions,
    l.deductions,
    l.net,
  ]);
  return downloadXlsx(`nomina-${p.periodStart}-a-${p.periodEnd}.xlsx`, [
    {
      name: "Nómina",
      title: [
        `Agropecuaria Mi Tierrita · ${periodTitle(p)}`,
        `Fecha de pago ${dateOnly(p.payDate)} · Estado: ${STATUS_LABELS[p.status]} · ${int(p.employeeCount)} empleados`,
        "Liquidación simplificada: no reemplaza la nómina electrónica de la DIAN ni incluye prestaciones sociales ni aportes del empleador.",
      ],
      headers: ["Empleado", "Documento", "Cargo", "Salario base", "Horas extra y recargos", "Bonificaciones", "Auxilio de transporte", "Devengado", "Salud 4 %", "Pensión 4 %", "Otros descuentos", "Deducciones", "Neto"],
      formats: ["text", "text", "text", "money", "money", "money", "money", "money", "money", "money", "money", "money", "money"],
      rows,
      footer: ["Total", "", "", "", "", "", "", p.totalGross, "", "", "", p.totalDeductions, p.totalNet],
    },
  ]);
};

/** Detalle de un periodo: líneas con edición en línea (solo en borrador), totales de la API y acciones del ciclo. */
export const PeriodDetail = ({ periodId, onBack }: Props) => {
  const query = usePayrollPeriod(periodId);
  const updateLine = useUpdatePayrollLine();
  const approve = useApprovePayrollPeriod();
  const pay = usePayPayrollPeriod();
  const remove = useDeletePayrollPeriod();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [exporting, setExporting] = useState(false);

  const runConfirm = async () => {
    try {
      if (confirm === "approve") await approve.mutateAsync(periodId);
      if (confirm === "pay") await pay.mutateAsync(periodId);
      if (confirm === "delete") {
        await remove.mutateAsync(periodId);
        setConfirm(null);
        onBack();
        return;
      }
      setConfirm(null);
    } catch {
      /* el hook ya avisó del error */
    }
  };

  const busy = approve.isPending || pay.isPending || remove.isPending;

  return (
    <section className={styles.detail} aria-labelledby="payroll-period-title">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Volver a periodos
        </Button>
      </div>
      <QueryState query={query} isEmpty={() => false} empty={<EmptyState title="Sin datos" />}>
        {(p) => {
          const editLine = (line: PayrollLine, field: keyof UpdatePayrollLineInput) => (value: number) =>
            updateLine.mutate({ periodId: p.id, lineId: line.id, [field]: value });
          const amount = (line: PayrollLine, field: keyof UpdatePayrollLineInput, label: string, hint?: string) =>
            p.editable ? (
              <LineAmountInput
                key={`${line.id}-${field}-${line[field]}`}
                value={line[field]}
                label={`${label} de ${line.employee.firstName} ${line.employee.lastName}`}
                {...(hint ? { hint } : {})}
                disabled={updateLine.isPending}
                onCommit={editLine(line, field)}
              />
            ) : (
              <span className={styles.num}>{money(line[field])}</span>
            );
          const columns: Column<PayrollLine>[] = [
            {
              key: "employee",
              header: "Empleado",
              render: (l) => (
                <div className={styles.who}>
                  <span className={styles.name}>
                    {l.employee.firstName} {l.employee.lastName}
                  </span>
                  <span className={styles.sub}>
                    {l.employee.position} · <span className={styles.code}>{l.employee.documentId}</span>
                  </span>
                </div>
              ),
            },
            { key: "base", header: "Salario base", align: "right", render: (l) => <span className={styles.num}>{money(l.base)}</span> },
            { key: "overtime", header: "Horas extra", align: "right", render: (l) => amount(l, "overtime", "Horas extra y recargos") },
            { key: "bonuses", header: "Bonificaciones", align: "right", render: (l) => amount(l, "bonuses", "Bonificaciones") },
            { key: "transport", header: "Auxilio transp.", label: "Auxilio de transporte", align: "right", render: (l) => amount(l, "transport", "Auxilio de transporte", TRANSPORT_HINT) },
            { key: "gross", header: "Devengado", align: "right", render: (l) => <span className={styles.num}>{money(l.gross)}</span> },
            { key: "health", header: "Salud 4 %", align: "right", render: (l) => <span className={styles.num}>{money(l.health)}</span> },
            { key: "pension", header: "Pensión 4 %", align: "right", render: (l) => <span className={styles.num}>{money(l.pension)}</span> },
            { key: "other", header: "Otros desc.", label: "Otros descuentos", align: "right", render: (l) => amount(l, "otherDeductions", "Otros descuentos") },
            { key: "deductions", header: "Deducciones", align: "right", render: (l) => <span className={styles.num}>{money(l.deductions)}</span> },
            { key: "net", header: "Neto", align: "right", render: (l) => <strong className={styles.num}>{money(l.net)}</strong> },
          ];
          const footer = (
            <tr>
              <td colSpan={5}>Total del periodo</td>
              <td className={styles.right}>{money(p.totalGross)}</td>
              <td colSpan={3} />
              <td className={styles.right}>{money(p.totalDeductions)}</td>
              <td className={styles.right}>
                <strong>{money(p.totalNet)}</strong>
              </td>
            </tr>
          );
          const text = confirm ? CONFIRM_TEXT[confirm] : null;
          return (
            <>
              <header className={styles.detailHead}>
                <div className={styles.detailTitle}>
                  <h2 id="payroll-period-title">{periodTitle(p)}</h2>
                  <p className={styles.sub}>
                    Pago el {dateOnly(p.payDate)} · Creado por {personName(p.createdBy)}
                    {p.approvedAt ? ` · Aprobado por ${personName(p.approvedBy)} el ${dateTime(p.approvedAt)}` : ""}
                    {p.paidAt ? ` · Pagado por ${personName(p.paidBy)} el ${dateTime(p.paidAt)}` : ""}
                  </p>
                </div>
                <Badge tone={STATUS_TONES[p.status]}>{STATUS_LABELS[p.status]}</Badge>
              </header>

              <StatGrid>
                <StatCard label="Devengado" value={money(p.totalGross)} hint="salario, horas extra, bonificaciones y auxilio" />
                <StatCard label="Deducciones" value={money(p.totalDeductions)} hint="salud, pensión y otros descuentos" />
                <StatCard label="Neto a pagar" value={money(p.totalNet)} tone="good" hint={`${int(p.employeeCount)} ${p.employeeCount === 1 ? "empleado" : "empleados"}`} />
              </StatGrid>

              <div className={styles.toolbar}>
                {p.editable ? <p className={styles.hintText}>{TRANSPORT_HINT} Escriba los valores en pesos; el sistema recalcula al salir de cada campo.</p> : <span />}
                <div className={styles.actions}>
                  <Button
                    variant="secondary"
                    loading={exporting}
                    onClick={async () => {
                      setExporting(true);
                      try {
                        await exportPeriod(p);
                      } finally {
                        setExporting(false);
                      }
                    }}
                  >
                    Exportar a Excel
                  </Button>
                  {p.status === "DRAFT" ? (
                    <>
                      <Button variant="danger" onClick={() => setConfirm("delete")}>
                        Eliminar borrador
                      </Button>
                      <Button onClick={() => setConfirm("approve")}>Aprobar</Button>
                    </>
                  ) : null}
                  {p.status === "APPROVED" ? <Button onClick={() => setConfirm("pay")}>Marcar pagado</Button> : null}
                </div>
              </div>

              <div className={styles.frame}>
                <DataTable columns={columns} rows={p.lines} rowKey={(l) => l.id} footer={footer} />
              </div>

              <div className={styles.overlays}>
                <Modal
                  open={text !== null}
                  title={text?.title ?? ""}
                  description={periodTitle(p)}
                  onClose={() => setConfirm(null)}
                  footer={
                    <>
                      <Button variant="secondary" onClick={() => setConfirm(null)} disabled={busy}>
                        Cancelar
                      </Button>
                      <Button variant={confirm === "delete" ? "danger" : "primary"} onClick={runConfirm} loading={busy}>
                        {text?.action ?? ""}
                      </Button>
                    </>
                  }
                >
                  <p className={styles.confirmText}>
                    {text?.text} {confirm === "pay" || confirm === "approve" ? `Neto del periodo: ${money(p.totalNet)}.` : ""}
                  </p>
                </Modal>
              </div>
            </>
          );
        }}
      </QueryState>
    </section>
  );
};
