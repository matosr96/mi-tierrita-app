import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  loading?: boolean;
  children: ReactNode;
};

export const Button = ({ variant = "primary", size = "md", block = false, loading = false, className, children, disabled, type = "button", ...rest }: Props) => (
  <button
    type={type}
    className={[styles.button, styles[variant], size !== "md" ? styles[size] : "", block ? styles.block : "", className ?? ""].join(" ")}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? "Procesando…" : children}
  </button>
);
