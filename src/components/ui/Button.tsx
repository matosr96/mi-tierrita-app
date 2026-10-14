import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  loading?: boolean;
  children: ReactNode;
};

/** Botón con texto que rueda al pasar el cursor (el rótulo sube y entra su copia desde abajo). */
export const Button = ({ variant = "primary", size = "md", block = false, loading = false, className, children, disabled, type = "button", ...rest }: Props) => {
  const rolls = typeof children === "string" && !loading;
  return (
    <button
      type={type}
      className={[styles.button, styles[variant], size !== "md" ? styles[size] : "", block ? styles.block : "", loading ? styles.loading : "", className ?? ""].join(" ")}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          Procesando…
        </>
      ) : rolls ? (
        <span className={styles.roll}>
          <span>{children}</span>
          <span aria-hidden="true">{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
