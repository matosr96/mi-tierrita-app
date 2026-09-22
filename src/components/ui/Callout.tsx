import type { ReactNode } from "react";
import styles from "./Callout.module.css";

const GoodMark = () => (
  <svg className={styles.mark} width="40" height="40" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <circle cx="18" cy="18" r="16" fill="#12795A" />
    <path d="M10.5 18.5 L15.5 23.5 L25.5 12.5" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const BadMark = () => (
  <svg className={styles.mark} width="40" height="40" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <circle cx="18" cy="18" r="16" fill="#B02A2E" />
    <line x1="18" y1="9.5" x2="18" y2="20" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="18" cy="25.5" r="1.9" fill="#FFFFFF" />
  </svg>
);
const WarnMark = () => (
  <svg className={styles.mark} width="40" height="40" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <circle cx="18" cy="18" r="16" fill="#A16207" />
    <line x1="18" y1="9.5" x2="18" y2="20" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="18" cy="25.5" r="1.9" fill="#FFFFFF" />
  </svg>
);

/** Bloque de veredicto del lienzo ("Conviene ampliar"): fondo suave, borde de color, ícono circular y aparte a la derecha. */
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
