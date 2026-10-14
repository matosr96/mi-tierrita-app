import { useEffect, useRef, useState } from "react";

/** Marca un elemento como visible la primera vez que entra en la ventana (y ya no lo desmarca). */
export const useInView = <T extends Element>(margin = "0px 0px -8% 0px") => {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, margin]);

  return [ref, inView] as const;
};
