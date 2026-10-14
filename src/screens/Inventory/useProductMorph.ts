import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import styles from "./ProductMosaic.module.css";

/** Nombre único del elemento compartido; solo lo lleva un elemento a la vez y solo mientras dura la transición. */
export const PRODUCT_HERO = "product-hero";

const canMorph = () => typeof document !== "undefined" && typeof document.startViewTransition === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Morfismo de elemento compartido (View Transitions API) entre la tarjeta o fila pulsada y el diálogo del producto.
 * Sin soporte o con movimiento reducido, abre y cierra sin transición.
 */
export const useProductMorph = <T>(setValue: (v: T | null) => void) => {
  const source = useRef<HTMLElement | null>(null);
  const [morphing, setMorphing] = useState(false);

  const mark = (on: boolean) => {
    const cls = styles.morphing ?? "";
    if (cls === "") return;
    document.documentElement.classList.toggle(cls, on);
  };

  const open = useCallback(
    (value: T, el: HTMLElement | null) => {
      source.current = el;
      if (!el || !canMorph()) {
        setValue(value);
        return;
      }
      el.style.viewTransitionName = PRODUCT_HERO;
      mark(true);
      const t = document.startViewTransition(() => {
        el.style.viewTransitionName = "";
        flushSync(() => {
          setMorphing(true);
          setValue(value);
        });
      });
      void t.finished.finally(() => {
        el.style.viewTransitionName = "";
        setMorphing(false);
        mark(false);
      });
    },
    [setValue],
  );

  const close = useCallback(() => {
    const el = source.current;
    source.current = null;
    if (!el || !el.isConnected || !canMorph()) {
      setValue(null);
      return;
    }
    flushSync(() => setMorphing(true));
    mark(true);
    const t = document.startViewTransition(() => {
      flushSync(() => {
        setMorphing(false);
        setValue(null);
      });
      el.style.viewTransitionName = PRODUCT_HERO;
    });
    void t.finished.finally(() => {
      el.style.viewTransitionName = "";
      mark(false);
    });
  }, [setValue]);

  return { open, close, heroName: morphing ? PRODUCT_HERO : undefined };
};
