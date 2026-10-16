import styles from "./SalesScreen.module.css";

/** Confirmación de la venta: marca de verificación, número de factura y total que devolvió la API. */
export const SaleSuccess = ({ invoice, total }: { invoice: string; total: string }) => (
  <div className={styles.success} role="status">
    <span className={styles.successMark} aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M5 10.5l3.2 3.2L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
    <div className={styles.successText}>
      <span className={styles.successLabel}>Venta confirmada</span>
      <span className={styles.successInvoice}>{invoice}</span>
    </div>
    <div className={styles.successTotal}>
      <span>Total</span>
      <strong>{total}</strong>
    </div>
  </div>
);
