import { useEffect, useState } from "react";

/** Devuelve el valor solo cuando deja de cambiar durante `delay` ms (búsquedas contra la API). */
export const useDebounced = <T,>(value: T, delay = 300): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};
