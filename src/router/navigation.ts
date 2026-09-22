import type { Role } from "@/types/api";

export type NavItem = {
  path: string;
  label: string;
  /** Trazos SVG (viewBox 0 0 22 22) tal como en el lienzo de diseño. */
  icon: string;
  roles: Role[];
  /** Roles que ven el módulo con candado (van a Acceso restringido), como Finanzas para la Secretaria. */
  lockedFor?: Role[];
  /** Clave de la insignia numérica del menú. */
  badge?: "inventory" | "batches" | "customers";
};
export type NavGroup = { title?: string; items: NavItem[] };

const ALL: Role[] = ["ADMIN", "SALES", "WAREHOUSE"];

const ICONS = {
  home: '<rect x="2.5" y="2.5" width="7" height="9" rx="1.5"/><rect x="12.5" y="2.5" width="7" height="5" rx="1.5"/><rect x="2.5" y="14.5" width="7" height="5" rx="1.5"/><rect x="12.5" y="10.5" width="7" height="9" rx="1.5"/>',
  inventory: '<path d="M3 7 L11 3 L19 7 L11 11 Z"/><path d="M3 7 V15 L11 19 V11"/><path d="M19 7 V15 L11 19"/>',
  batches: '<rect x="3.5" y="4.5" width="15" height="14" rx="2"/><line x1="3.5" y1="8.5" x2="18.5" y2="8.5"/><line x1="7.5" y1="2.5" x2="7.5" y2="6"/><line x1="14.5" y1="2.5" x2="14.5" y2="6"/><circle cx="11" cy="13.5" r="2.2"/>',
  sales: '<circle cx="9" cy="17.8" r="1.5"/><circle cx="16" cy="17.8" r="1.5"/><path d="M2.5 3.5 h2.4 l2.3 10.2 h9.6 l2.1 -7.2 h-12.6"/>',
  customers: '<circle cx="8.5" cy="7.5" r="3.1"/><path d="M2.5 18 c0 -3.1 2.7 -4.9 6 -4.9 s6 1.8 6 4.9"/><path d="M14.6 5.1 a3.1 3.1 0 0 1 0 5.8"/><path d="M16.2 13.7 c2.1 .6 3.3 2.1 3.3 4.3"/>',
  suppliers: '<rect x="2.5" y="6" width="9.6" height="8" rx="1.5"/><path d="M12.1 8.6 h3.5 l3.4 3.2 v2.2 h-6.9 z"/><circle cx="6.4" cy="16.8" r="1.6"/><circle cx="15.4" cy="16.8" r="1.6"/>',
  finance: '<path d="M3 15 L8 9 L12.5 12.5 L19 5"/><circle cx="8" cy="9" r="1.8" fill="currentColor"/><circle cx="12.5" cy="12.5" r="1.8" fill="currentColor"/>',
  reports: '<path d="M5.5 2.5 h8 l4 4 v13 a1.5 1.5 0 0 1 -1.5 1.5 h-10.5 a1.5 1.5 0 0 1 -1.5 -1.5 v-15.5 a1.5 1.5 0 0 1 1.5 -1.5 z"/><line x1="8" y1="12" x2="14" y2="12"/><line x1="8" y1="15.5" x2="12" y2="15.5"/>',
  users: '<circle cx="11" cy="7.5" r="3.6"/><path d="M4 19 c0 -3.6 3.1 -5.6 7 -5.6 s7 2 7 5.6"/>',
  audits: '<path d="M4 5.5 h14"/><path d="M4 11 h14"/><path d="M4 16.5 h9"/><circle cx="17" cy="16.5" r="2"/>',
  signout: '<path d="M8.6 3.5 H5 a1.6 1.6 0 0 0 -1.6 1.6 v11.8 a1.6 1.6 0 0 0 1.6 1.6 h3.6"/><path d="M13.8 7.4 L17.4 11 L13.8 14.6"/><line x1="17.1" y1="11" x2="8.8" y2="11"/>',
} as const;

export const NAV_ICONS = ICONS;

/** Mapa de pantallas por rol (documento 07, sección 2). La misma lista alimenta el menú y las guardas. */
export const NAV_GROUPS: NavGroup[] = [
  { items: [{ path: "/", label: "Inicio", icon: ICONS.home, roles: ALL }] },
  {
    title: "Operación",
    items: [
      { path: "/inventario", label: "Inventario", icon: ICONS.inventory, roles: ALL, badge: "inventory" },
      { path: "/lotes", label: "Lotes y vencimientos", icon: ICONS.batches, roles: ["ADMIN", "WAREHOUSE"], badge: "batches" },
      { path: "/ventas", label: "Ventas", icon: ICONS.sales, roles: ["ADMIN", "SALES"] },
      { path: "/clientes", label: "Clientes y cartera", icon: ICONS.customers, roles: ["ADMIN", "SALES"], badge: "customers" },
      { path: "/proveedores", label: "Proveedores", icon: ICONS.suppliers, roles: ["ADMIN", "WAREHOUSE"] },
    ],
  },
  {
    title: "Gestión",
    items: [
      { path: "/finanzas", label: "Finanzas y crédito", icon: ICONS.finance, roles: ["ADMIN"], lockedFor: ["SALES"] },
      { path: "/reportes", label: "Reportes", icon: ICONS.reports, roles: ["ADMIN", "SALES"] },
    ],
  },
  {
    title: "Sistema",
    items: [
      { path: "/usuarios", label: "Usuarios y roles", icon: ICONS.users, roles: ["ADMIN"] },
      { path: "/auditoria", label: "Auditoría", icon: ICONS.audits, roles: ["ADMIN"] },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const findRoute = (pathname: string): NavItem | undefined =>
  ALL_NAV_ITEMS.find((i) => (i.path === "/" ? pathname === "/" : pathname === i.path || pathname.startsWith(`${i.path}/`)));

export const rolesFor = (path: string): Role[] => ALL_NAV_ITEMS.find((i) => i.path === path)?.roles ?? ["ADMIN"];

/** Un módulo aparece en el menú si el rol lo usa o si lo ve con candado. */
export const isVisibleFor = (item: NavItem, role: Role): boolean => item.roles.includes(role) || (item.lockedFor?.includes(role) ?? false);
export const isLockedFor = (item: NavItem, role: Role): boolean => !item.roles.includes(role) && (item.lockedFor?.includes(role) ?? false);
