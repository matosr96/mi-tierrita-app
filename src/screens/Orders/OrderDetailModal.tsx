import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCancelOrder, useOrder } from "@/hooks/orders";
import { useAiStore } from "@/stores/ai";
import { dateOnly, dateTime, int, money } from "@/lib/format";
import { Badge, Button, Callout, DataTable, ErrorState, Loading, Modal, type Column } from "@/components/ui";
import type { OrderDetail, OrderLine } from "@/types/api";
import { DeliverOrderPanel } from "./DeliverOrderPanel";
import { COUNTERPART_LABEL, DUE_LABEL, PRICE_LABEL, dueText, dueTone, statusLabel, statusTone } from "./orderLabels";
import styles from "./OrdersScreen.module.css";

type Props = {
  orderId: number;
  /** Venta recién registrada en el punto de venta para este encargo: abre «Marcar entregado» con ella elegida. */
  initialSaleId: number | null;
  onClose: () => void;
  onEdit: (order: OrderDetail) => void;
  onReceive: (order: OrderDetail) => void;
};

type Step = "view" | "deliver" | "cancel";

/**
 * Detalle del pedido: líneas y total tal como los devuelve la API. Acciones de un pedido abierto: a proveedor,
 * «Recibir» (y «Editar» mientras siga pendiente); de cliente, «Registrar la venta» (lleva al punto de venta prellenado)
 * y «Marcar entregado»; ambos, «Cancelar pedido» con confirmación. Solo llega aquí quien maneja ese tipo de pedido.
 */
export const OrderDetailModal = ({ orderId, initialSaleId, onClose, onEdit, onReceive }: Props) => {
  const query = useOrder(orderId);
  const cancel = useCancelOrder();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(initialSaleId !== null ? "deliver" : "view");

  const order = query.data;
  const isSupplier = order?.kind === "SUPPLIER";

  const registerSale = (o: OrderDetail) => {
    useAiStore.getState().handOff({
      type: "sale",
      customerId: o.customerId,
      customerName: o.customerName,
      paymentType: "CASH",
      lines: o.lines.map((l) => ({ productId: l.productId, productName: l.productName, quantity: l.quantity, unitPrice: l.unitPrice, available: 0 })),
      estimatedTotal: o.total,
      warnings: ["El punto de venta cobra el precio vigente de cada producto; el precio acordado del pedido queda como referencia."],
      orderId: o.id,
    });
    navigate("/ventas/nueva");
  };

  const confirmCancel = async (o: OrderDetail) => {
    try {
      await cancel.mutateAsync(o.id);
      setStep("view");
    } catch {
      /* el toast ya avisó */
    }
  };

  const lineColumns = (o: OrderDetail): Column<OrderLine>[] => [
    { key: "product", header: "Producto", render: (l) => (
      <span className={styles.lineProduct}>
        <span>{l.productName}</span>
        <span className={styles.mono}>{l.sku}</span>
      </span>
    ) },
    { key: "qty", header: "Cantidad", align: "right", render: (l) => int(l.quantity) },
    ...(o.kind === "SUPPLIER"
      ? [{ key: "received", header: "Recibidas", align: "right" as const, render: (l: OrderLine) => (l.receivedQuantity > 0 && l.pendingQuantity > 0 ? <Badge tone="warn">{`${int(l.receivedQuantity)} de ${int(l.quantity)}`}</Badge> : int(l.receivedQuantity)) }]
      : []),
    { key: "price", header: PRICE_LABEL[o.kind], align: "right", render: (l) => money(l.unitPrice) },
    { key: "total", header: "Subtotal", align: "right", render: (l) => money(l.lineTotal) },
  ];

  const footer = (o: OrderDetail) => {
    if (!o.open || step !== "view") return <Button onClick={onClose}>Cerrar</Button>;
    return (
      <>
        <Button variant="ghost" onClick={() => setStep("cancel")}>
          Cancelar pedido
        </Button>
        {o.status === "PENDING" ? (
          <Button variant="secondary" onClick={() => onEdit(o)}>
            Editar
          </Button>
        ) : null}
        {isSupplier ? (
          <Button onClick={() => onReceive(o)}>{o.status === "PARTIAL" ? "Recibir lo que falta" : "Recibir"}</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => registerSale(o)}>
              Registrar la venta
            </Button>
            <Button onClick={() => setStep("deliver")}>Marcar entregado</Button>
          </>
        )}
      </>
    );
  };

  const tone = order ? dueTone(order) : null;
  const due = order ? dueText(order) : null;

  return (
    <Modal
      open
      wide
      title={order ? `Pedido #${order.id}` : "Pedido"}
      description={order ? `${isSupplier ? "A proveedor" : "De cliente"} · ${order.counterpartName}` : undefined}
      onClose={onClose}
      footer={order ? footer(order) : <Button onClick={onClose}>Cerrar</Button>}
    >
      {query.isPending ? (
        <Loading inline text="Cargando pedido…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : order ? (
        <div className={styles.detail}>
          {tone && due ? (
            <Callout tone={tone} title={due}>
              {isSupplier ? "La mercancía aún no ha llegado completa." : "El encargo aún no se ha entregado."}
            </Callout>
          ) : null}
          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>Estado</dt>
              <dd>
                <Badge tone={statusTone(order.status)}>{statusLabel(order.status)}</Badge>
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>{COUNTERPART_LABEL[order.kind]}</dt>
              <dd>{order.counterpartName}</dd>
            </div>
            <div className={styles.fact}>
              <dt>{DUE_LABEL[order.kind]}</dt>
              <dd>{dateOnly(order.dueDate)}</dd>
            </div>
            <div className={styles.fact}>
              <dt>Registró</dt>
              <dd>
                {order.createdByUsername} · {dateTime(order.createdAt)}
              </dd>
            </div>
            {order.closedAt ? (
              <div className={styles.fact}>
                <dt>{order.status === "CANCELLED" ? "Canceló" : isSupplier ? "Recibió" : "Entregó"}</dt>
                <dd>
                  {order.closedByUsername ?? "—"} · {dateTime(order.closedAt)}
                </dd>
              </div>
            ) : null}
            {order.saleInvoiceNumber ? (
              <div className={styles.fact}>
                <dt>Venta</dt>
                <dd className={styles.mono}>{order.saleInvoiceNumber}</dd>
              </div>
            ) : null}
            {order.note ? (
              <div className={[styles.fact, styles.factWide].join(" ")}>
                <dt>Nota</dt>
                <dd>{order.note}</dd>
              </div>
            ) : null}
          </dl>

          <div className={styles.linesTable}>
            <DataTable
              columns={lineColumns(order)}
              rows={order.lines}
              rowKey={(l) => l.id}
              footer={
                <tr>
                  <td colSpan={lineColumns(order).length - 1}>Total</td>
                  <td className={styles.right}>
                    <strong>{money(order.total)}</strong>
                  </td>
                </tr>
              }
            />
          </div>

          {step === "deliver" && !isSupplier && order.status === "PENDING" ? (
            <DeliverOrderPanel order={order} initialSaleId={initialSaleId} onCancel={() => setStep("view")} onDelivered={() => setStep("view")} />
          ) : null}

          {step === "cancel" && order.open ? (
            <section className={[styles.panel, styles.panelDanger].join(" ")} aria-labelledby="cancel-title">
              <h3 id="cancel-title" className={styles.panelTitle}>
                ¿Cancelar el pedido #{order.id}?
              </h3>
              <p className={styles.panelText}>
                {order.status === "PARTIAL" ? "Lo que ya se recibió sigue en bodega; lo que falta deja de esperarse. " : ""}Esta acción no se puede deshacer.
              </p>
              <div className={styles.panelActions}>
                <Button variant="secondary" onClick={() => setStep("view")} disabled={cancel.isPending}>
                  Volver
                </Button>
                <Button variant="danger" onClick={() => confirmCancel(order)} loading={cancel.isPending}>
                  Sí, cancelar pedido
                </Button>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
};
