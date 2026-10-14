import type { CSSProperties } from "react";
import { Odometer } from "@/components/motion";
import styles from "./SalesScreen.module.css";

const SPARKS = 14;

/** Celebración al confirmar una venta: la marca se dibuja, salen chispas lima y el total gira en el odómetro. */
export const SaleSuccess = ({ invoice, total }: { invoice: string; total: string }) => (
  <div className={styles.success} role="status">
    <div className={styles.successMark} aria-hidden="true">
      {Array.from({ length: SPARKS }, (_, i) => (
        <span key={i} className={styles.spark} style={{ "--a": `${(360 / SPARKS) * i}deg`, "--d": `${44 + (i % 3) * 14}px` } as CSSProperties} />
      ))}
      <span className={styles.ripple} />
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="29" pathLength={1} className={styles.successCircle} />
        <path d="M20 33 L28.5 41.5 L45 24" pathLength={1} className={styles.successCheck} />
      </svg>
    </div>
    <div className={styles.successText}>
      <span className={styles.successLabel}>Venta confirmada</span>
      <span className={styles.successInvoice}>{invoice}</span>
    </div>
    <div className={styles.successTotal}>
      <span>Total</span>
      <strong>
        <Odometer value={total} />
      </strong>
    </div>
  </div>
);
