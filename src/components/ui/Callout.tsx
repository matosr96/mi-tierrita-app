import type { ReactNode } from "react";
import styles from "./Callout.module.css";

const GoodMark = () => (
  <svg className={styles.mark} width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <circle cx="18" cy="18" r="16" fill="var(--good)" />
    <path className={styles.check} pathLength={1} d="M10.5 18.5 L15.5 23.5 L25.5 12.5" stroke="var(--surface)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const BadMark = () => (
  <svg className={styles.mark} width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <circle cx="18" cy="18" r="16" fill="var(--bad)" />
    <line x1="18" y1="9.5" x2="18" y2="20" stroke="var(--surface)" strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="18" cy="25.5" r="1.9" fill="var(--surface)" />
  </svg>
);
const WarnMark = () => (
  <svg className={styles.mark} width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <circle cx="18" cy="18" r="16" fill="var(--warn)" />
    <line x1="18" y1="9.5" x2="18" y2="20" stroke="var(--surface)" strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="18" cy="25.5" r="1.9" fill="var(--surface)" />
  </svg>
);

/** Bloque de veredicto ("Conviene ampliar"): fondo suave, borde de color, ícono y aparte a la derecha. */
export const Callout = ({
  tone = "neutral",
  title,
  children,
  aside,
  mark = true,
}: {
  tone?: "good" | "warn" | "bad" | "neutral";
  title?: string;
  children?: ReactNode;
  aside?: ReactNode;
  mark?: boolean;
}) => (
  <div className={[styles.callout, styles[tone]].join(" ")}>
    {mark && title ? tone === "good" ? <GoodMark /> : tone === "bad" ? <BadMark /> : tone === "warn" ? <WarnMark /> : null : null}
    <div className={styles.body}>
      {title ? <span className={styles.title}>{title}</span> : null}
      {children}
    </div>
    {aside}
  </div>
);
