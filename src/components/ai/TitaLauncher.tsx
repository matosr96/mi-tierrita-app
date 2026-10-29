import { useLocation } from "react-router-dom";
import { useAiStore } from "@/stores/ai";
import { TitaOrb } from "./TitaOrb";
import styles from "./TitaLauncher.module.css";

/**
 * Lanzador flotante de Tita en toda pantalla (brief de octubre de 2026, punto 10): el orbe abajo a la derecha abre el
 * panel rápido. No aparece en /tita (la conversación ya está a la vista) ni mientras el panel está abierto.
 */
export const TitaLauncher = () => {
  const open = useAiStore((s) => s.open);
  const setOpen = useAiStore((s) => s.setOpen);
  const pending = useAiStore((s) => s.pending);
  const location = useLocation();
  if (open || location.pathname === "/tita") return null;
  return (
    <button type="button" className={styles.launcher} onClick={() => setOpen(true)} aria-label="Preguntarle a Tita" title="Preguntarle a Tita (Ctrl+J)">
      <TitaOrb size={58} busy={pending} />
      <span className={styles.label}>{pending ? "Tita está trabajando…" : "Tita"}</span>
    </button>
  );
};
