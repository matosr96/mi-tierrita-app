import { useToastStore } from "@/stores/toasts";
import styles from "./Toasts.module.css";

/**
 * Avisos breves. Las dos regiones vivas están SIEMPRE en el documento (una región que aparece junto con el primer
 * aviso no la anuncian muchos lectores de pantalla): los errores en `assertive` con `role="alert"`, el resto en
 * `polite` con `role="status"`. Cada aviso es un botón: se cierra con clic, Enter o Espacio.
 */
export const Toasts = () => {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const errors = toasts.filter((t) => t.kind === "error");
  const others = toasts.filter((t) => t.kind !== "error");
  const item = (t: (typeof toasts)[number]) => (
    <button key={t.id} type="button" className={[styles.toast, styles[t.kind]].join(" ")} onClick={() => dismiss(t.id)} aria-label={`${t.text}. Cerrar aviso`}>
      {t.text}
    </button>
  );
  return (
    <div className={styles.stack}>
      <div role="alert" aria-live="assertive" aria-atomic="false" className={styles.region}>
        {errors.map(item)}
      </div>
      <div role="status" aria-live="polite" aria-atomic="false" className={styles.region}>
        {others.map(item)}
      </div>
    </div>
  );
};
