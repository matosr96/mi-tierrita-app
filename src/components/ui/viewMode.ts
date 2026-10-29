import { useCallback, useState } from "react";

/** Modos de vista de un listado: tarjetas, lista compacta o tabla. */
export type ViewMode = "cards" | "list" | "table";
export const VIEW_MODES: readonly ViewMode[] = ["cards", "list", "table"];

/** Valores que guardaron versiones anteriores (Inventario guardaba «mosaic» para las tarjetas). */
const ALIASES = new Map<string, ViewMode>([["mosaic", "cards"]]);

type ReadStorage = Pick<Storage, "getItem">;
type WriteStorage = Pick<Storage, "setItem">;

/** Clave de la preferencia en el almacenamiento: `mi-tierrita:<key>-vista`. */
export const viewModeKey = (key: string): string => `mi-tierrita:${key}-vista`;

/** Lee la vista guardada; si falta, no está permitida o el almacenamiento falla, devuelve `fallback`. */
export const readViewMode = <M extends ViewMode>(storage: ReadStorage | null | undefined, key: string, allowed: readonly M[], fallback: M): M => {
  try {
    const raw = storage?.getItem(viewModeKey(key));
    if (raw === null || raw === undefined) return fallback;
    const value = ALIASES.get(raw) ?? raw;
    return (allowed as readonly string[]).includes(value) ? (value as M) : fallback;
  } catch {
    return fallback;
  }
};

/** Guarda la vista; sin almacenamiento la preferencia dura solo esta visita. */
export const writeViewMode = (storage: WriteStorage | null | undefined, key: string, value: ViewMode): void => {
  try {
    storage?.setItem(viewModeKey(key), value);
  } catch {
    /* almacenamiento bloqueado o lleno: se ignora */
  }
};

/** Acceder a `localStorage` puede lanzar (ventana privada, datos bloqueados). */
const browserStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** Vista preferida de un listado en este navegador (comodidad por usuario, no dato de negocio). */
export const useViewMode = <M extends ViewMode>(key: string, allowed: readonly M[], fallback: M): [M, (next: M) => void] => {
  const [mode, setMode] = useState<M>(() => readViewMode(browserStorage(), key, allowed, fallback));
  const change = useCallback(
    (next: M) => {
      setMode(next);
      writeViewMode(browserStorage(), key, next);
    },
    [key],
  );
  return [mode, change];
};
