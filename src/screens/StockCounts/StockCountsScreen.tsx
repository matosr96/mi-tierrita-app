import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Chips } from "@/components/ui";
import type { StockCount, StockCountStatus } from "@/types/api";
import { AdjustmentPreviewModal } from "./AdjustmentPreviewModal";
import { CountFormModal } from "./CountFormModal";
import { CountList } from "./CountList";
import { CountSheet } from "./CountSheet";
import { STATUS_LABELS, STATUS_ORDER } from "./stockCountLabels";
import styles from "./StockCountsScreen.module.css";

type StatusFilter = StockCountStatus | "ALL";
const FILTERS: { value: StatusFilter; label: string }[] = [{ value: "ALL", label: "Todos" }, ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] }))];

/**
 * Conteos de inventario (ADMIN y bodega): programar, contar en la hoja (cómoda en el celular), enviar y, la
 * administración, revisar y aplicar el ajuste de existencias. `?c=<id>` abre la hoja de un conteo (lo usa el calendario).
 */
export const StockCountsScreen = () => {
  const [params, setParams] = useSearchParams();
  const selected = Number(params.get("c")) || null;
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<{ open: false } | { open: true; count: StockCount | null }>({ open: false });
  const [reviewId, setReviewId] = useState<number | null>(null);

  const open = (id: number | null) => setParams(id === null ? {} : { c: String(id) });

  return (
    <>
      <PageHeader
        title="Conteos de inventario"
        subtitle="Compare lo que hay en bodega con lo que dice el sistema. La administración aprueba el ajuste de existencias."
        actions={<Button onClick={() => setForm({ open: true, count: null })}>Programar conteo</Button>}
      />
      <div className={styles.page}>
        {selected === null ? (
          <>
            <Chips
              options={FILTERS}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            />
            <CountList status={status} page={page} onPage={setPage} onOpen={open} onCreate={() => setForm({ open: true, count: null })} />
          </>
        ) : (
          <CountSheet key={selected} id={selected} onBack={() => open(null)} onEdit={(count) => setForm({ open: true, count })} onReview={setReviewId} />
        )}
        {form.open ? (
          <CountFormModal
            count={form.count}
            onClose={() => setForm({ open: false })}
            onCreated={(id) => {
              setForm({ open: false });
              open(id);
            }}
          />
        ) : null}
        {reviewId !== null ? <AdjustmentPreviewModal id={reviewId} onClose={() => setReviewId(null)} /> : null}
      </div>
    </>
  );
};
