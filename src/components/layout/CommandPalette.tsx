import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalSearch } from "@/hooks/search";
import { int, money } from "@/lib/format";
import { ICONS, NAV_GROUPS, isLockedFor, type NavItem } from "@/router/navigation";
import { ROLE_LABELS } from "@/stores/session";
import type { Role, SearchResults } from "@/types/api";
import styles from "./CommandPalette.module.css";

type Entry = NavItem & { group: string };
/** Un resultado de la paleta: pantalla o registro, con a dónde lleva. */
type Item = { key: string; group: string; label: string; sub?: string; icon: string; to: string };

const SEARCH_MIN = 2;
const DEBOUNCE_MS = 250;
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Resultados de la API convertidos en filas de la paleta (brief 29): producto, cliente, persona y proveedor. */
const toItems = (results: SearchResults | undefined): Item[] => {
  if (!results) return [];
  return [
    ...(results.products ?? []).map(
      (p): Item => ({ key: `p${p.id}`, group: "Productos", label: p.name, sub: `${p.sku} · disponible ${int(p.availableStock)} · ${money(p.salePrice)}`, icon: ICONS.inventory, to: `/inventario?buscar=${encodeURIComponent(p.sku)}` }),
    ),
    ...(results.customers ?? []).map((c): Item => ({ key: `c${c.id}`, group: "Clientes", label: c.name, sub: `${c.documentId} · saldo ${money(c.balance)}`, icon: ICONS.customers, to: `/clientes?c=${c.id}` })),
    ...(results.people ?? []).map(
      (u): Item => ({ key: `u${u.id}`, group: "Personas", label: `${u.firstName} ${u.lastName}`, sub: `@${u.username} · ${ROLE_LABELS[u.role]}`, icon: ICONS.users, to: `/chat?con=${u.id}` }),
    ),
    ...(results.suppliers ?? []).map((s): Item => ({ key: `s${s.id}`, group: "Proveedores", label: s.name, icon: ICONS.suppliers, to: "/proveedores" })),
  ];
};

/**
 * Paleta de comandos (⌘K / Ctrl+K): salta a cualquier pantalla que el rol puede usar y, desde dos caracteres,
 * busca productos, clientes, personas y proveedores en la API (solo los grupos que el rol puede ver).
 */
export const CommandPalette = ({ open, onClose, role }: { open: boolean; onClose: () => void; role: Role }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < SEARCH_MIN) {
      setDebounced("");
      return;
    }
    const id = window.setTimeout(() => setDebounced(q), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);
  const search = useGlobalSearch(open ? debounced : "");

  const entries = useMemo<Entry[]>(
    () => [
      ...NAV_GROUPS.flatMap((g) => g.items.filter((i) => i.roles.includes(role) && !isLockedFor(i, role)).map((i) => ({ ...i, group: g.title ?? "General" }))),
      // Mi perfil no está en el menú lateral, pero se puede buscar (también como "contraseña").
      { path: "/perfil", label: "Mi perfil", icon: ICONS.users, roles: [role], group: "Su cuenta · contraseña" },
    ],
    [role],
  );
  const screens = useMemo<Item[]>(() => {
    const q = normalize(query.trim());
    const list = q
      ? (() => {
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
        })()
      : entries;
    return list.map((e): Item => ({ key: e.path, group: "Pantallas", label: e.label, sub: e.group, icon: e.icon, to: e.path }));
  }, [entries, query]);

  const searching = debounced.length >= SEARCH_MIN;
  const records = useMemo(() => (searching && search.data ? toItems(search.data) : []), [searching, search.data]);
  const items = useMemo(() => [...screens, ...records], [screens, records]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);
  useEffect(() => setIndex(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [index, items.length]);

  if (!open) return null;

  const go = (item: Item | undefined) => {
    if (!item) return;
    onClose();
    navigate(item.to, { viewTransition: true });
  };

  const pending = searching && search.isPending;
  const noResults = items.length === 0 && !pending;
  let lastGroup = "";

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Buscar en el sistema">
        <div className={styles.searchRow}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.5 13.5 L17.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos, clientes, personas y pantallas"
            aria-label="Buscar productos, clientes, personas y pantallas"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(items[index]);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
          />
          <kbd>esc</kbd>
        </div>
        <ul className={styles.list} role="listbox" ref={listRef} aria-busy={pending}>
          {noResults ? <li className={styles.none}>Sin resultados para “{query.trim()}”.</li> : null}
          {items.map((item, i) => {
            const heading = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.key} role="option" aria-selected={i === index} style={{ "--i": i } as CSSProperties}>
                {heading ? <div className={styles.groupTitle}>{heading}</div> : null}
                <button type="button" className={[styles.item, i === index ? styles.active : ""].join(" ")} onMouseEnter={() => setIndex(i)} onClick={() => go(item)}>
                  <svg className={styles.icon} viewBox="0 0 22 22" aria-hidden="true" dangerouslySetInnerHTML={{ __html: item.icon }} />
                  <span className={styles.text}>
                    <span className={styles.label}>{item.label}</span>
                    {item.sub ? <span className={styles.sub}>{item.sub}</span> : null}
                  </span>
                  <span className={styles.enter} aria-hidden="true">
                    ↵
                  </span>
                </button>
              </li>
            );
          })}
          {pending ? (
            <li className={styles.status} aria-live="polite">
              Buscando…
            </li>
          ) : null}
          {searching && search.isError ? <li className={styles.status}>No se pudo buscar en la API.</li> : null}
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
