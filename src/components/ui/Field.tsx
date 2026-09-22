import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import styles from "./Field.module.css";

type FieldProps = { label: string; hint?: string; error?: string | undefined; children: ReactNode; htmlFor?: string };

/** Etiqueta + control + ayuda/error. El error puede venir del cliente o del código 400 del backend. */
export const Field = ({ label, hint, error, children, htmlFor }: FieldProps) => (
  <div className={styles.field}>
    <label className={styles.label} htmlFor={htmlFor}>
      {label}
    </label>
    {children}
    {error ? <span className={styles.error}>{error}</span> : hint ? <span className={styles.hint}>{hint}</span> : null}
  </div>
);

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
