import { useCustomers } from "@/hooks/customers";
import { int } from "@/lib/format";
import styles from "./CarteraAside.module.css";

/** Tarjeta de cartera de la secretaria (lienzo "SecClientes"): solo cuentas del listado, el reporte de cartera es de ADMIN. */
export const SalesCartera = () => {
  const active = useCustomers({ active: true, limit: 1 });
  const withBalance = useCustomers({ withBalance: true, limit: 1 });
  const pending = withBalance.data?.count;

  return (
    <aside className={styles.aside} aria-labelledby="cartera-title">
      <header className={styles.head}>
        <h2 id="cartera-title" className={styles.title}>
          Saldos y abonos
        </h2>
        <span className={styles.sub}>Consulta de cartera</span>
      </header>
      <div className={styles.hero}>{pending !== undefined ? int(pending) : <span className={styles.heroPending}>—</span>}</div>
      <p className={styles.heroHint}>{withBalance.isError ? "No disponible" : pending === undefined ? "Consultando…" : pending === 1 ? "Cliente con saldo pendiente" : "Clientes con saldo pendiente"}</p>
      <dl className={styles.figures}>
        <div>
          <dt>Clientes activos</dt>
          <dd>{active.data ? int(active.data.count) : active.isError ? "No disponible" : "—"}</dd>
        </div>
      </dl>
      <p className={styles.note}>Puede registrar abonos y consultar el estado de cada cliente. Cambiar un cupo de crédito lo autoriza el administrador.</p>
    </aside>
  );
};
