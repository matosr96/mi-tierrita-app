import type { CSSProperties, ReactNode } from "react";
import { useInView } from "./useInView";
import styles from "./motion.module.css";

type Props = {
  children: ReactNode;
  /** Retardo en milisegundos (para escalonar varios bloques). */
  delay?: number;
  variant?: "rise" | "fade" | "blur" | "scale";
  className?: string;
};

/** Hace aparecer su contenido (subida + desenfoque) cuando entra en pantalla. */
export const Reveal = ({ children, delay = 0, variant = "rise", className }: Props) => {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={[styles.reveal, styles[variant], inView ? styles.in : "", className ?? ""].join(" ")}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
};
