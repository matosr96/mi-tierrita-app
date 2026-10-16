import { useState } from "react";
import { Link } from "react-router-dom";
import { AiDraftModal } from "@/components/ai/AiDraftModal";
import { RichText } from "@/components/ai/RichText";
import { Card } from "@/components/ui";
import { useAiStatus, useBriefing } from "@/hooks/ai";
import { useAiStore } from "@/stores/ai";
import { dateOnly, int, money, num1 } from "@/lib/format";
import type { AiInsight } from "@/types/api";
import styles from "./BriefingCard.module.css";

export type InsightRow = { key: string; tone: "bad" | "warn" | "neutral"; tag: string; text: string; to?: { href: string; label: string }; ask?: { prompt: string; label: string }; collect?: { customerId: number; name: string } };

const days = (n: number) => (n === 1 ? "1 día" : `${int(n)} días`);

/** Cada recomendación con su porqué en cifras y la acción que tiene sentido para ella. */
/** Texto, etiqueta y acciones de una recomendación (también lo usa la página de Tita). */
export const toRow = (i: AiInsight): InsightRow => {
  switch (i.kind) {
    case "restock":
      return {
        key: `r-${i.productId}`,
        tone: i.coverDays < 3 ? "bad" : "warn",
        tag: "Reponer",
        text:
          i.available === 0
            ? `${i.productName}: no queda nada vendible y se vende ${num1(i.dailyAvg)} u. al día. Para un mes: ${int(i.suggestedQty)} u.`
            : `${i.productName}: ${int(i.available)} vendibles alcanzan para unos ${days(Math.max(1, Math.round(i.coverDays)))} (se vende ${num1(i.dailyAvg)} u. al día). Para un mes: ${int(i.suggestedQty)} u.`,
        ask: { label: "¿A quién y a cuánto?", prompt: `Necesito reponer ${i.productName} (${i.sku}): quedan ${i.available} vendibles y sugieren ${i.suggestedQty} unidades. ¿A qué proveedor y a qué costo le compré las últimas veces? Prepare el borrador de compra si tiene los datos.` },
      };
    case "rotate":
      return {
        key: `o-${i.batchId}`,
        tone: i.daysToExpire <= 15 ? "bad" : "warn",
        tag: "Rotar",
        text: `Lote #${i.batchId} de ${i.productName} vence el ${dateOnly(i.expiresAt)} (${days(i.daysToExpire)}): al ritmo actual sobrarían ${int(i.surplus)} de ${int(i.remaining)} u, ${money(i.surplusCost)} a costo.`,
        to: { href: "/lotes", label: "Ver lotes" },
        ask: { label: "Ideas", prompt: `El lote #${i.batchId} de ${i.productName} vence el ${i.expiresAt} y al ritmo actual sobrarían ${i.surplus} unidades. ¿Qué me recomienda para venderlo a tiempo sin perder plata? Revise precio, costo y quién lo compra.` },
      };
    case "collect":
      return {
        key: `c-${i.customerId}`,
        tone: i.overdue ? "bad" : "warn",
        tag: i.overdue ? "Cartera vencida" : "Cobrar",
        text: `${i.name} debe ${money(i.balance)} (${int(i.usedPct)} % del cupo)${i.daysSincePayment === null ? ", sin abonos registrados" : `, último abono hace ${days(i.daysSincePayment)}`}.`,
        to: { href: "/clientes", label: "Ver cliente" },
        collect: { customerId: i.customerId, name: i.name },
      };
    case "idle":
      return {
        key: `i-${i.productId}`,
        tone: "neutral",
        tag: "Sin rotación",
        text: `${i.productName}: ${int(i.available)} u sin venderse ${i.lastSaleAt ? `desde el ${dateOnly(i.lastSaleAt)}` : "nunca"}; ${money(i.costValue)} quietos en bodega.`,
        ask: { label: "Ideas", prompt: `${i.productName} (${i.sku}) tiene ${i.available} unidades sin venderse ${i.lastSaleAt ? `desde ${i.lastSaleAt.slice(0, 10)}` : "nunca"}. ¿Qué haría para moverlo?` },
      };
  }
};

/**
 * "Sugerencias de hoy": recomendaciones que calcula el servidor (ritmo de venta, vencimientos, cartera, rotación) y,
 * si hay IA, un párrafo que dice qué hacer primero. Distinto de los pendientes: no son problemas ya ocurridos sino lo
 * que conviene hacer para evitarlos. Las preguntas abren el asistente con el contexto ya escrito.
 */
export const BriefingCard = ({ className }: { className?: string }) => {
  const briefing = useBriefing();
  const ai = useAiStatus();
  const ask = useAiStore((s) => s.ask);
  const [collectFor, setCollectFor] = useState<{ customerId: number; name: string } | null>(null);
  const data = briefing.data;
  if (briefing.isError || !data || data.insights.length === 0) return null;
  const rows = data.insights.map(toRow);

  return (
    <Card className={[styles.card, className ?? ""].join(" ")} title="Sugerencias de hoy" subtitle="Calculadas con el ritmo de venta, los vencimientos y la cartera">
      {data.text ? (
        <div className={styles.summary}>
          <span className={styles.summaryLabel}>Lo que sugiere Tita</span>
          <RichText text={data.text} />
        </div>
      ) : null}
      <ul className={styles.rows}>
        {rows.map((r) => (
          <li key={r.key} className={styles.row}>
            <span className={[styles.tag, styles[r.tone]].join(" ")}>{r.tag}</span>
            <p className={styles.text}>{r.text}</p>
            <span className={styles.actions}>
              {r.to ? (
                <Link to={r.to.href} className={styles.link}>
                  {r.to.label}
                </Link>
              ) : null}
              {ai.enabled && r.collect ? (
                <button type="button" className={styles.askBtn} onClick={() => setCollectFor(r.collect!)}>
                  Mensaje de cobro
                </button>
              ) : null}
              {ai.enabled && r.ask ? (
                <button type="button" className={styles.askBtn} onClick={() => ask(r.ask!.prompt)}>
                  {r.ask.label}
                </button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {collectFor ? (
        <AiDraftModal
          open
          onClose={() => setCollectFor(null)}
          title={`Mensaje de cobro · ${collectFor.name}`}
          request={{ kind: "collection_message", customerId: collectFor.customerId }}
        />
      ) : null}
    </Card>
  );
};
