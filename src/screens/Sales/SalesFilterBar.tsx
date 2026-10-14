import { useCustomers } from "@/hooks/customers";
import { Field, Input, Select } from "@/components/ui";
import { addDaysIso, todayIso } from "@/lib/format";
import type { SaleStatus } from "@/types/api";
import { UserFilter } from "./UserFilter";
import styles from "./SalesFilterBar.module.css";

const PRESETS = [
  { days: 0, label: "Hoy" },
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 365, label: "1 año" },
];

type Props = {
  from: string;
  to: string;
  status: SaleStatus | "";
  customerId: number | null;
  userId: number | null;
  /** El filtro por vendedor solo existe para ADMIN (GET /users no está permitido para SALES). */
  showUser: boolean;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onStatus: (v: SaleStatus | "") => void;
  onCustomer: (v: number | null) => void;
  onUser: (v: number | null) => void;
  onPeriod: (days: number) => void;
  onClear: () => void;
};

/** Barra de mando del historial: atajos de período, rango de fechas y filtros, siempre a la vista en una sola franja. */
export const SalesFilterBar = ({ from, to, status, customerId, userId, showUser, onFrom, onTo, onStatus, onCustomer, onUser, onPeriod, onClear }: Props) => {
  const customers = useCustomers({ limit: 100 });
  const today = todayIso();
  const activePreset = to === today ? PRESETS.find((p) => from === addDaysIso(today, -p.days))?.days : undefined;
  const filtered = status !== "" || customerId !== null || (showUser && userId !== null);

  return (
    <div className={styles.bar} role="search" aria-label="Filtros del historial de ventas">
      <div className={styles.group}>
        <span className={styles.label}>Período</span>
        <div className={styles.presets}>
          {PRESETS.map((p) => (
            <button key={p.days} type="button" className={[styles.preset, activePreset === p.days ? styles.presetOn : ""].join(" ")} aria-pressed={activePreset === p.days} onClick={() => onPeriod(p.days)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <span className={styles.divider} aria-hidden="true" />

      <div className={styles.fields}>
        <div className={styles.range}>
          <Field label="Desde" htmlFor="sales-from">
            <Input id="sales-from" type="date" value={from} max={to} onChange={(e) => onFrom(e.target.value)} />
          </Field>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
          <Field label="Hasta" htmlFor="sales-to">
            <Input id="sales-to" type="date" value={to} min={from} onChange={(e) => onTo(e.target.value)} />
          </Field>
        </div>
        <Field label="Estado" htmlFor="sales-status">
          <Select id="sales-status" value={status} onChange={(e) => onStatus(e.target.value as SaleStatus | "")}>
            <option value="">Todas</option>
            <option value="COMPLETED">Completadas</option>
            <option value="VOIDED">Anuladas</option>
          </Select>
        </Field>
        <Field label="Cliente" htmlFor="sales-customer" hint={customers.isError ? "No se pudo cargar la lista." : undefined}>
          <Select id="sales-customer" value={customerId ?? ""} disabled={!customers.data} onChange={(e) => onCustomer(e.target.value === "" ? null : Number(e.target.value))}>
            <option value="">{customers.isPending ? "Cargando…" : "Todos"}</option>
            {customers.data?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        {showUser ? <UserFilter value={userId} onChange={onUser} /> : null}
      </div>

      {filtered ? (
        <button type="button" className={styles.clear} onClick={onClear}>
          Quitar filtros
        </button>
      ) : null}
    </div>
  );
};
