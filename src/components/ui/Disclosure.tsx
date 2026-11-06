import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Disclosure.module.css";

type Props = {
  title: string;
  /** Qué hay dentro, en pocas palabras (se lee junto al título). */
  hint?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Mientras sea `true` el bloque se abre solo (por ejemplo, si un campo de dentro tiene un error que hay que ver). */
  forceOpen?: boolean;
};

/** Bloque plegable («Avanzado»): `<details>` nativo, accesible por teclado, cerrado por omisión. */
export const Disclosure = ({ title, hint, children, defaultOpen = false, forceOpen = false }: Props) => {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (forceOpen && ref.current) ref.current.open = true;
  }, [forceOpen]);
  return (
    <details ref={ref} className={styles.disclosure} open={defaultOpen || undefined}>
      <summary className={styles.summary}>
        <span className={styles.title}>{title}</span>
        {hint ? <span className={styles.hint}>{hint}</span> : null}
        <svg className={styles.chevron} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3.5 5.5 7 9 10.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
};
