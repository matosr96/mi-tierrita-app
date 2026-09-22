import type { Role } from "@/types/api";

export type NavItem = { path: string; label: string; icon: string; roles: Role[] };
export type NavGroup = { title?: string; items: NavItem[] };

const ALL: Role[] = ["ADMIN", "SALES", "WAREHOUSE"];

/** Mapa de pantallas por rol (documento 07, sección 2). La misma lista alimenta el menú y las guardas. */
export const NAV_GROUPS: NavGroup[] = [
  { items: [{ path: "/", label: "Inicio", icon: "▦", roles: ALL }] },
  {
    title: "Operación",
    items: [
      { path: "/inventario", label: "Inventario", icon: "◫", roles: ALL },
      { path: "/lotes", label: "Lotes y vencimientos", icon: "◷", roles: ["ADMIN", "WAREHOUSE"] },
      { path: "/ventas", label: "Ventas", icon: "◔", roles: ["ADMIN", "SALES"] },
      { path: "/clientes", label: "Clientes y cartera", icon: "◉", roles: ["ADMIN", "SALES"] },
      { path: "/proveedores", label: "Proveedores", icon: "◈", roles: ["ADMIN", "WAREHOUSE"] },
    ],
  },
  {
    title: "Gestión",
    items: [
      { path: "/finanzas", label: "Finanzas y crédito", icon: "◢", roles: ["ADMIN"] },
      { path: "/reportes", label: "Reportes", icon: "▤", roles: ["ADMIN", "SALES"] },
    ],
  },
  {
    title: "Sistema",
    items: [
      { path: "/usuarios", label: "Usuarios y roles", icon: "◎", roles: ["ADMIN"] },
      { path: "/auditoria", label: "Auditoría", icon: "≡", roles: ["ADMIN"] },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const findRoute = (pathname: string): NavItem | undefined =>
  ALL_NAV_ITEMS.find((i) => (i.path === "/" ? pathname === "/" : pathname === i.path || pathname.startsWith(`${i.path}/`)));

export const rolesFor = (path: string): Role[] => ALL_NAV_ITEMS.find((i) => i.path === path)?.roles ?? ["ADMIN"];
