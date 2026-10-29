/**
 * Apariencia de la app (brief de octubre de 2026, punto 36): «Claro» (predeterminado), «Oscuro» o «Del dispositivo».
 * Se guarda en este navegador y se aplica como `html[data-theme]`; `styles/theme.css` redefine allí las variables.
 */
export type ThemePreference = "light" | "dark" | "system";
export const THEME_KEY = "mi-tierrita:apariencia";
const VALUES: readonly ThemePreference[] = ["light", "dark", "system"];

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** Lee la preferencia guardada; ante un valor raro o un almacenamiento bloqueado, «Claro». */
export const readTheme = (storage: StorageLike | null | undefined): ThemePreference => {
  try {
    const v = storage?.getItem(THEME_KEY);
    return VALUES.includes(v as ThemePreference) ? (v as ThemePreference) : "light";
  } catch {
    return "light";
  }
};

export const writeTheme = (storage: StorageLike | null | undefined, value: ThemePreference): void => {
  try {
    storage?.setItem(THEME_KEY, value);
  } catch {
    /* navegación privada o almacenamiento bloqueado: se aplica solo en esta pestaña */
  }
};

const safeStorage = (): StorageLike | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** Aplica la preferencia al documento (sin parpadeo si se llama antes de pintar). */
export const applyTheme = (value: ThemePreference = readTheme(safeStorage())): void => {
  document.documentElement.dataset["theme"] = value;
};

export const setTheme = (value: ThemePreference): void => {
  writeTheme(safeStorage(), value);
  applyTheme(value);
};

export const currentTheme = (): ThemePreference => readTheme(safeStorage());
