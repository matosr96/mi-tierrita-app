import { useEffect, useRef } from "react";
import styles from "./SigninScreen.module.css";

const INTERACTIVE = "a, button, input, label, [role='button']";

/** Cursor de la portada: un punto y un anillo que lo sigue con retraso; crece sobre lo que se puede tocar. Solo con ratón. */
export const LoginCursor = () => {
  const dot = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia?.("(pointer: fine)").matches) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const pos = { x: -100, y: -100, rx: -100, ry: -100 };
    let frame = 0;
    let shown = false;

    const tick = () => {
      pos.rx += (pos.x - pos.rx) * 0.18;
      pos.ry += (pos.y - pos.ry) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${pos.rx}px, ${pos.ry}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!shown) {
        shown = true;
        pos.rx = pos.x;
        pos.ry = pos.y;
        dot.current?.parentElement?.setAttribute("data-on", "1");
      }
      const hot = (e.target as Element | null)?.closest?.(INTERACTIVE);
      dot.current?.parentElement?.setAttribute("data-hot", hot ? "1" : "0");
    };
    const leave = () => dot.current?.parentElement?.setAttribute("data-on", "0");
    const down = () => dot.current?.parentElement?.setAttribute("data-down", "1");
    const up = () => dot.current?.parentElement?.setAttribute("data-down", "0");

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <div className={styles.cursor} aria-hidden="true">
      <span ref={ring} className={styles.cursorRing}>
        <span />
      </span>
      <span ref={dot} className={styles.cursorDot}>
        <span />
      </span>
    </div>
  );
};
