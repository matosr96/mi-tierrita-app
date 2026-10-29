import { cloneElement, isValidElement, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import styles from "./Field.module.css";

type FieldProps = { label: string; hint?: string; error?: string | undefined; children: ReactNode; htmlFor?: string };

const ErrorIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
    <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="4.8" x2="8" y2="8.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="11.3" r="0.9" fill="currentColor" />
  </svg>
);

/**
 * Etiqueta + control + ayuda/error. El error puede venir del cliente o del código 400 del backend. El mensaje de error
 * se anuncia (`role="alert"`) y, cuando el campo tiene `htmlFor` y un solo control hijo, queda enlazado a él con
 * `aria-describedby` (y `aria-invalid` mientras haya error) sin que cada formulario tenga que hacerlo.
 */
export const Field = ({ label, hint, error, children, htmlFor }: FieldProps) => {
  const describedBy = htmlFor && (error || hint) ? `${htmlFor}-${error ? "error" : "hint"}` : undefined;
  const control =
    describedBy && isValidElement<Record<string, unknown>>(children)
      ? cloneElement(children, { "aria-describedby": describedBy, ...(error ? { "aria-invalid": true } : {}) })
      : children;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {control}
      {error ? (
        <span className={styles.error} role="alert" id={describedBy}>
          <ErrorIcon />
          <span>{error}</span>
        </span>
      ) : hint ? (
        <span className={styles.hint} id={describedBy}>
          {hint}
        </span>
      ) : null}
    </div>
  );
};

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
export const Input = ({ invalid = false, className, ...rest }: InputProps) => (
  <input className={[styles.control, className ?? ""].join(" ")} aria-invalid={invalid} {...rest} />
);

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };
export const Select = ({ invalid = false, className, children, ...rest }: SelectProps) => (
  <select className={[styles.control, className ?? ""].join(" ")} aria-invalid={invalid} {...rest}>
    {children}
  </select>
);

export const FieldRow = ({ children }: { children: ReactNode }) => <div className={styles.row}>{children}</div>;

export const Checkbox = ({ label, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <label className={styles.checkbox}>
    <input type="checkbox" {...rest} />
    {label}
  </label>
);
