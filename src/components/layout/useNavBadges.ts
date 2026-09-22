import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { useSessionStore } from "@/stores/session";
import { reportsService } from "@/services/reports";
import { batchesService } from "@/services/batches";
import { productsService } from "@/services/products";
import { customersService } from "@/services/customers";
import type { NavItem } from "@/router/navigation";

/**
 * Insignias del menú (como en el lienzo: Inventario 6, Lotes 3, Clientes 2).
 * Cada rol consulta solo lo que puede ver; una consulta que falle deja la insignia vacía.
 */
export const useNavBadges = (): Partial<Record<NonNullable<NavItem["badge"]>, number>> => {
  const role = useSessionStore((s) => s.user?.role);
  const isAdmin = role === "ADMIN";
  const inventory = useQuery({
    queryKey: [...keys.reports, "inventory", 30],
    queryFn: () => reportsService.inventory(30),
    enabled: isAdmin,
    staleTime: 60_000,
  });
  const products = useQuery({
    queryKey: [...keys.products, { limit: 100, active: true }],
    queryFn: () => productsService.list({ limit: 100, active: true }),
    enabled: role !== undefined && !isAdmin,
    staleTime: 60_000,
  });
  const batches = useQuery({
    queryKey: [...keys.batches, "expiring", { days: 30, limit: 1 }],
    queryFn: () => batchesService.expiring({ days: 30, limit: 1 }),
    enabled: isAdmin || role === "WAREHOUSE",
    staleTime: 60_000,
  });
  const receivables = useQuery({
    queryKey: [...keys.reports, "receivables", 30],
    queryFn: () => reportsService.receivables(30),
    enabled: isAdmin,
    staleTime: 60_000,
  });
  const withBalance = useQuery({
    queryKey: [...keys.customers, { withBalance: true, limit: 1 }],
    queryFn: () => customersService.list({ withBalance: true, limit: 1 }),
    enabled: role === "SALES",
    staleTime: 60_000,
  });

  return {
    inventory: isAdmin ? inventory.data?.outOfStock : products.data?.items.filter((p) => p.stock === 0).length,
    batches: batches.data?.count,
    customers: isAdmin ? receivables.data?.overdueCustomers : withBalance.data?.count,
  };
};
