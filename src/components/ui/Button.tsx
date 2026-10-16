import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  loading?: boolean;
  children: ReactNode;
};

/** Botón del kit: primario verde, secundario con borde, fantasma, peligro y acento. */
export const Button = ({ variant = "primary", size = "md", block = false, loading = false, className, children, disabled, type = "button", ...rest }: Props) => (
  <button
    type={type}
    className={[styles.button, styles[variant], size !== "md" ? styles[size] : "", block ? styles.block : "", loading ? styles.loading : "", className ?? ""].join(" ")}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? (
      <>
        <span className={styles.spinner} aria-hidden="true" data-motion />
        Procesando…
      </>
    ) : (
      children
    )}
  </button>
);
