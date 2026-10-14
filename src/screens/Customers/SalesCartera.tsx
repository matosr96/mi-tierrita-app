import { useCustomers } from "@/hooks/customers";
import { Odometer, TopoField } from "@/components/motion";
import { int } from "@/lib/format";
import styles from "./CarteraAside.module.css";

/** Tarjeta oscura de la secretaria (lienzo "SecClientes"): solo cuentas del listado, el reporte de cartera es de ADMIN. */
export const SalesCartera = () => {
  const active = useCustomers({ active: true, limit: 1 });
  const withBalance = useCustomers({ withBalance: true, limit: 1 });
  const pending = withBalance.data?.count;

  return (
    <aside className={styles.aside} aria-labelledby="cartera-title">
      <TopoField className={styles.topo} rings={11} signal={4} seed={0.9} />
      <div className={styles.label}>Cartera · consulta</div>
      <h2 id="cartera-title" className={styles.title}>
        Saldos y <em>abonos</em>
      </h2>
      <div className={[styles.hero, pending === 0 ? styles.heroClear : ""].join(" ")}>
        {pending !== undefined ? <Odometer value={String(pending).padStart(2, "0")} /> : <span className={styles.heroPending}>··</span>}
      </div>
      <p className={styles.heroHint}>{withBalance.isError ? "No disponible" : pending === undefined ? "Consultando…" : pending === 1 ? "cliente con saldo pendiente" : "clientes con saldo pendiente"}</p>
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
