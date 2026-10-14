import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { NAV_GROUPS, isLockedFor, type NavItem } from "@/router/navigation";
import type { Role } from "@/types/api";
import styles from "./CommandPalette.module.css";

type Entry = NavItem & { group: string };

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Paleta de comandos (⌘K / Ctrl+K): salta a cualquier módulo que el rol puede usar. */
export const CommandPalette = ({ open, onClose, role }: { open: boolean; onClose: () => void; role: Role }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const entries = useMemo<Entry[]>(
    () => NAV_GROUPS.flatMap((g) => g.items.filter((i) => i.roles.includes(role) && !isLockedFor(i, role)).map((i) => ({ ...i, group: g.title ?? "General" }))),
    [role],
  );
  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return entries;
    // Primero lo que empieza por la búsqueda, luego lo que tiene una palabra que empieza por ella, luego el resto.
    const rank = (e: Entry) => {
      const label = normalize(e.label);
      if (label.startsWith(q)) return 0;
      if (label.split(/\s+/).some((w) => w.startsWith(q))) return 1;
      return 2;
    };
    return entries
      .filter((e) => normalize(`${e.label} ${e.group}`).includes(q))
      .map((e, i) => ({ e, i, r: rank(e) }))
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .map((x) => x.e);
  }, [entries, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);
  useEffect(() => setIndex(0), [query]);

  if (!open) return null;

  const go = (entry: Entry | undefined) => {
    if (!entry) return;
    onClose();
    navigate(entry.path, { viewTransition: true });
  };

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Ir a un módulo">
        <div className={styles.searchRow}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.5 13.5 L17.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ir a… (inventario, ventas, reportes)"
            aria-label="Buscar módulo"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(results[index]);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
          />
          <kbd>esc</kbd>
        </div>
        <ul className={styles.list} role="listbox">
          {results.length === 0 ? <li className={styles.none}>Ningún módulo coincide con “{query}”.</li> : null}
          {results.map((e, i) => (
            <li key={e.path} role="option" aria-selected={i === index} style={{ "--i": i } as CSSProperties}>
              <button type="button" className={[styles.item, i === index ? styles.active : ""].join(" ")} onMouseEnter={() => setIndex(i)} onClick={() => go(e)}>
                <svg className={styles.icon} viewBox="0 0 22 22" aria-hidden="true" dangerouslySetInnerHTML={{ __html: e.icon }} />
                <span className={styles.label}>{e.label}</span>
                <span className={styles.group}>{e.group}</span>
                <span className={styles.enter} aria-hidden="true">
                  ↵
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.foot}>
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> moverse
          </span>
          <span>
            <kbd>↵</kbd> abrir
          </span>
          <span className={styles.brand}>Mi Tierrita SIG</span>
        </div>
      </div>
    </div>
  );
};
