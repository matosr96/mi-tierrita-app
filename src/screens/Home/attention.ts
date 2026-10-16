import { dateOnly, int, money } from "@/lib/format";
import { LOW_STOCK, expiredUnits } from "@/screens/Inventory/stockStatus";
import type { Customer, InventoryReport, Product, ProductBatch, ReceivablesReport } from "@/types/api";

/** Un pendiente: tono, texto, a dónde lleva y la etiqueta corta de la derecha. */
export type AttentionItem = { key: string; tone: "bad" | "warn" | "neutral"; text: string; to: string; tag: string };

/** Pendientes del administrador a partir de los reportes de inventario y cartera (solo agrupa lo que da la API). */
export const adminAttention = (inv: InventoryReport | undefined, rec: ReceivablesReport | undefined): AttentionItem[] => {
  const items: AttentionItem[] = [];
  if (inv) {
    if (inv.expired.batches > 0) {
      items.push({ key: "expired", tone: "bad", text: `${int(inv.expired.batches)} ${inv.expired.batches === 1 ? "lote vencido" : "lotes vencidos"} en bodega`, to: "/lotes", tag: money(inv.expired.costValue) });
    }
    if (inv.expiringSoon.batches > 0) {
      items.push({ key: "expiring", tone: "bad", text: `${int(inv.expiringSoon.batches)} ${inv.expiringSoon.batches === 1 ? "lote vence" : "lotes vencen"} en ${inv.expiringDays} días`, to: "/lotes", tag: money(inv.expiringSoon.costValue) });
    }
    if (inv.outOfStock > 0) {
      items.push({ key: "stock", tone: "warn", text: `${int(inv.outOfStock)} ${inv.outOfStock === 1 ? "producto sin existencias" : "productos sin existencias"}`, to: "/inventario", tag: "Reponer" });
    }
  }
  if (rec && rec.overdueCustomers > 0) {
    items.push({ key: "overdue", tone: "warn", text: `${int(rec.overdueCustomers)} ${rec.overdueCustomers === 1 ? "cliente con cartera vencida" : "clientes con cartera vencida"}`, to: "/clientes", tag: money(rec.overdueBalance) });
  }
  return items;
};

/** Pendientes de cobro: clientes con saldo; los que agotaron el cupo van primero. */
export const pendingItems = (customers: Customer[]): AttentionItem[] =>
  customers.map((c) =>
    c.availableCredit <= 0
      ? { key: `credit-${c.id}`, tone: "bad", text: `${c.name} agotó su cupo de crédito (saldo ${money(c.balance)})`, to: "/clientes", tag: "Consultar" }
      : { key: `balance-${c.id}`, tone: "warn", text: `${c.name} tiene ${money(c.balance)} pendientes de pago`, to: "/clientes", tag: "Cobrar" },
  );

/** "Qué hacer hoy": lotes vencidos o por vencer y productos sin existencias o con pocas. */

export const todoItems = (batches: ProductBatch[], products: Product[]): AttentionItem[] => {
  const items: AttentionItem[] = [];
  for (const b of batches.filter((x) => x.expired).slice(0, 2)) {
    items.push({ key: `expired-${b.id}`, tone: "bad", text: `Retirar ${b.productName}: lote #${b.id} venció el ${dateOnly(b.expiresAt)}`, to: "/lotes", tag: "Vencido" });
  }
  for (const b of batches.filter((x) => !x.expired).slice(0, 2)) {
    items.push({ key: `fefo-${b.id}`, tone: b.daysToExpire <= 7 ? "bad" : "warn", text: `Sacar al frente ${b.productName}: vence en ${int(b.daysToExpire)} ${b.daysToExpire === 1 ? "día" : "días"}`, to: "/lotes", tag: "FEFO" });
  }
  for (const p of products.filter((x) => x.stock === 0).slice(0, 2)) {
    items.push({ key: `out-${p.id}`, tone: "bad", text: `Sin existencias de ${p.name}`, to: "/inventario", tag: "Reponer" });
  }
  // Lo que queda se cuenta en unidades vendibles: unidades vencidas no "quedan" (ya salen arriba como "Retirar").
  const sellable = (x: Product) => x.stock - expiredUnits(x);
  for (const p of products.filter((x) => x.stock > 0 && sellable(x) === 0).slice(0, 2)) {
    items.push({ key: `void-${p.id}`, tone: "bad", text: `Todo lo que queda de ${p.name} está vencido`, to: "/inventario", tag: "Reponer" });
  }
  for (const p of products.filter((x) => sellable(x) > 0 && sellable(x) < LOW_STOCK).slice(0, 2)) {
    const n = sellable(p);
    items.push({ key: `low-${p.id}`, tone: "warn", text: `${n === 1 ? "Queda 1 unidad" : `Quedan ${int(n)} unidades`} de ${p.name}`, to: "/inventario", tag: "Avisar" });
  }
  return items.slice(0, 6);
};

