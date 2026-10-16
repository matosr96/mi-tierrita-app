import type { ReactNode } from "react";
import styles from "./Card.module.css";

type Props = { title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string; flush?: boolean; soft?: boolean };

/** Tarjeta: superficie con borde fino, título y subtítulo en mono. */
export const Card = ({ title, subtitle, actions, children, className, flush = false, soft = false }: Props) => (
  <section className={[styles.card, flush ? styles.flush : "", soft ? styles.soft : "", className ?? ""].join(" ")}>
    {title !== undefined || actions !== undefined ? (
      <header className={styles.header} style={flush ? { padding: "17px 19px 0" } : undefined}>
        <div className={styles.title}>
          {title !== undefined ? <h2>{title}</h2> : null}
          {subtitle !== undefined ? <span className={styles.subtitle}>{subtitle}</span> : null}
        </div>
        {actions}
      </header>
    ) : null}
    {children}
  </section>
);
