import type { ReactNode } from "react";
import type { ApiError } from "@/lib/errors";
import { toApiError } from "@/lib/errors";
import { Button } from "./Button";
import styles from "./States.module.css";

/** Los tres estados de toda pantalla (documento 02, sección 5): cargando, vacío y con datos. */
export const Loading = ({ text = "Cargando…", inline = false }: { text?: string; inline?: boolean }) =>
  inline ? (
    <div className={[styles.box, styles.inline].join(" ")} role="status">
      <div className={styles.loader} aria-hidden="true" data-motion>
        <span />
        <span />
        <span />
        <span />
      </div>
      <span className={styles.loadText}>{text}</span>
    </div>
  ) : (
    // Esqueleto con brillo suave (lo único que se anima): insinúa la forma del contenido mientras llega.
    <div className={styles.skeleton} role="status" aria-label={text} data-motion>
      <span className={styles.skLine} style={{ width: "38%" }} />
      <span className={styles.skBlock} />
      <span className={styles.skLine} style={{ width: "92%" }} />
      <span className={styles.skLine} style={{ width: "76%" }} />
      <span className={styles.skLine} style={{ width: "84%" }} />
      <span className={styles.loadText}>{text}</span>
    </div>
  );

/** Marca de los estados vacíos: una hoja dentro de un círculo. */
const EmptyMark = () => (
  <svg className={styles.emptyMark} width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <circle cx="32" cy="32" r="30" className={styles.ring3} />
    <circle cx="32" cy="32" r="21" className={styles.ring2} />
    <circle cx="32" cy="32" r="12" className={styles.ring1} />
    <path d="M32 38 V29" className={styles.leafStem} />
    <path d="M32 33 C 28.5 33 26.5 30.6 26.5 27 C 30 27 32 29.4 32 33 Z" className={styles.leaf} />
    <path d="M32 31 C 35.5 31 37.5 28.6 37.5 25 C 34 25 32 27.4 32 31 Z" className={styles.leaf} />
  </svg>
);

export const EmptyState = ({ title, text, action }: { title: string; text?: string; action?: ReactNode }) => (
  <div className={styles.box}>
    <EmptyMark />
    <span className={styles.title}>{title}</span>
    {text ? <span>{text}</span> : null}
    {action}
  </div>
);

export const ErrorState = ({ error, onRetry }: { error: unknown; onRetry?: () => void }) => {
  const e: ApiError = toApiError(error);
  return (
    <div className={styles.box} role="alert">
      <span className={styles.title}>No se pudo cargar</span>
      <span>{e.message}</span>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
};

type QueryLike<T> = { data: T | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };

/** Envuelve una consulta y renderiza cargando / error / vacío / con datos en el orden correcto. */
export const QueryState = <T,>({ query, isEmpty, empty, children }: { query: QueryLike<T>; isEmpty?: (data: T) => boolean; empty: ReactNode; children: (data: T) => ReactNode }) => {
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (query.data === undefined) return <Loading />;
  if (isEmpty?.(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
};
