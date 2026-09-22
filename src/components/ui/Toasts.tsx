import { useToastStore } from "@/stores/toasts";
import styles from "./Toasts.module.css";

export const Toasts = () => {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  if (toasts.length === 0) return null;
  return (
    <div className={styles.stack} aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={[styles.toast, styles[t.kind]].join(" ")} onClick={() => dismiss(t.id)}>
          {t.text}
        </div>
      ))}
    </div>
  );
};
