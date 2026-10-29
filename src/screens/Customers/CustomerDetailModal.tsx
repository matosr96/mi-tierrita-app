import { useEffect, useState, type CSSProperties } from "react";
import { useCustomer, useCustomerBalance } from "@/hooks/customers";
import { useAiStatus } from "@/hooks/ai";
import { useSessionStore } from "@/stores/session";
import { Badge, Button, Loading, Modal, QueryState, Tabs } from "@/components/ui";
import { CommentsPanel } from "@/components/comments/CommentsPanel";
import { RecordHistory } from "@/components/audits/RecordHistory";
import { AiDraftModal } from "@/components/ai/AiDraftModal";
import { dateOnly, dateTime, int, money } from "@/lib/format";
import type { Customer } from "@/types/api";
import { Monogram } from "./Monogram";
import { PaymentForm } from "./PaymentForm";
import styles from "./CustomerDetailModal.module.css";

type Props = { customerId: number | null; onClose: () => void; onEdit: (customer: Customer) => void };

/** Pestañas del detalle: cartera, comentarios del cliente y, para la administración, su historial de cambios (brief 33). */
type Tab = "account" | "comments" | "history";

const balanceTone = (balance: number, availableCredit: number) => (availableCredit < 0 ? styles.toneBad : balance > 0 ? styles.toneWarn : styles.toneGood);

/** Estado de cartera de un cliente (RF-04.4) y registro de abonos (CU-12): resumen del saldo, ficha y abono. */
export const CustomerDetailModal = ({ customerId, onClose, onEdit }: Props) => {
  const customer = useCustomer(customerId);
  const balance = useCustomerBalance(customerId);
  const c = customer.data;
  const role = useSessionStore((s) => s.user?.role);
  const ai = useAiStatus();
  const [draftOpen, setDraftOpen] = useState(false);
  useEffect(() => setDraftOpen(false), [customerId]);
  const [tab, setTab] = useState<Tab>("account");
  useEffect(() => setTab("account"), [customerId]);
  const tabs: { value: Tab; label: string }[] = [{ value: "account", label: "Cartera" }, { value: "comments", label: "Comentarios" }, ...(role === "ADMIN" ? [{ value: "history" as const, label: "Historial" }] : [])];
  const canDraft = ai.enabled && (role === "ADMIN" || role === "SALES") && customerId !== null && (balance.data?.balance ?? 0) > 0;

  return (
    <>
      <Modal
        open={customerId !== null}
        title={c?.name ?? "Cliente"}
        description={c ? `Documento ${c.documentId}${c.phone ? ` · Tel. ${c.phone}` : ""}` : undefined}
        // Con el borrador abierto, Esc solo cierra el borrador.
        onClose={draftOpen ? () => undefined : onClose}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            {canDraft ? (
              <Button variant="secondary" onClick={() => setDraftOpen(true)}>
                Mensaje de cobro
              </Button>
            ) : null}
            {c ? <Button onClick={() => onEdit(c)}>Editar</Button> : null}
          </>
        }
      >
        <div className={styles.tabs}>
          <Tabs options={tabs} value={tab} onChange={setTab} ariaLabel="Secciones del cliente" />
        </div>
        {tab === "account" ? (
          <QueryState query={customer} empty={null}>
            {(cust) => (
              <div className={styles.wrap}>
                <section className={styles.hero} aria-label="Saldo del cliente">
                  <div className={styles.heroTop}>
                    <Monogram name={cust.name} size="lg" muted={!cust.active} />
                    <div className={styles.heroWho}>
                      <span className={styles.label}>Estado de cartera</span>
                      <div className={styles.tags}>
                        <Badge tone={cust.active ? "good" : "neutral"}>{cust.active ? "Activo" : "Inactivo"}</Badge>
                        {balance.data?.overdue ? <Badge tone="bad">Cartera vencida · {int(balance.data.overdueDays)} días sin abonar</Badge> : null}
                        {cust.availableCredit < 0 ? <Badge tone="bad">Excedió cupo</Badge> : null}
                      </div>
                    </div>
                  </div>
  
                  {balance.isPending ? (
                    <Loading inline text="Consultando saldo…" />
                  ) : balance.isError ? (
                    <div className={styles.heroError}>
                      <span>No se pudo consultar el saldo.</span>
                      <Button variant="secondary" size="sm" onClick={() => balance.refetch()}>
                        Reintentar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className={styles.balanceLabel}>Saldo pendiente</span>
                      <div className={[styles.balance, balanceTone(balance.data.balance, balance.data.availableCredit)].join(" ")}>
                        {money(balance.data.balance)}
                      </div>
                      {balance.data.creditLimit > 0 ? (
                        <div
                          className={styles.meter}
                          role="meter"
                          aria-valuemin={0}
                          aria-valuemax={Math.max(balance.data.creditLimit, balance.data.balance)}
                          aria-valuenow={balance.data.balance}
                          aria-label="Saldo frente al cupo autorizado"
                          // Proporción solo visual: saldo frente al cupo, ambos de la API.
                          style={{ "--fill": Math.min(1, Math.max(0, balance.data.balance / balance.data.creditLimit)) } as CSSProperties}
                        >
                          <span className={styles.meterFill} />
                        </div>
                      ) : (
                        <p className={styles.cashOnly}>Sin cupo de crédito: este cliente compra de contado.</p>
                      )}
                      <dl className={styles.pair}>
                        <div>
                          <dt>Cupo autorizado</dt>
                          <dd>{money(balance.data.creditLimit)}</dd>
                        </div>
                        <div>
                          <dt>Disponible</dt>
                          <dd className={balance.data.availableCredit < 0 ? styles.negative : ""}>{money(balance.data.availableCredit)}</dd>
                        </div>
                      </dl>
                    </>
                  )}
                </section>
  
                <dl className={styles.facts}>
                  <div className={styles.fact}>
                    <dt>Documento</dt>
                    <dd className={styles.mono}>{cust.documentId}</dd>
                  </div>
                  <div className={styles.fact}>
                    <dt>Teléfono</dt>
                    <dd className={styles.mono}>{cust.phone ?? "—"}</dd>
                  </div>
                  <div className={styles.fact}>
                    <dt>Cliente desde</dt>
                    <dd>{dateOnly(cust.createdAt)}</dd>
                  </div>
                  <div className={styles.fact}>
                    <dt>Última venta a crédito</dt>
                    <dd>{balance.data ? dateTime(balance.data.lastCreditSaleAt) : "—"}</dd>
                  </div>
                  <div className={styles.fact}>
                    <dt>Último abono</dt>
                    <dd>{balance.data ? dateTime(balance.data.lastPaymentAt) : "—"}</dd>
                  </div>
                </dl>
  
                <section className={styles.pay}>
                  <header className={styles.payHead}>
                    <h3 className={styles.payLabel}>Registrar abono</h3>
                    <span className={styles.payHint}>El saldo baja con cada abono</span>
                  </header>
                  <PaymentForm customerId={cust.id} active={cust.active} />
                </section>
              </div>
            )}
          </QueryState>
        ) : null}
        {tab === "comments" && customerId !== null ? <CommentsPanel entity="customers" entityId={customerId} /> : null}
        {tab === "history" && customerId !== null ? <RecordHistory entity="customers" entityId={customerId} /> : null}
      </Modal>
      {canDraft && customerId !== null ? (
        <AiDraftModal
          open={draftOpen}
          onClose={() => setDraftOpen(false)}
          title="Mensaje de cobro"
          description={c ? `Para ${c.name} · saldo pendiente ${money(balance.data?.balance ?? 0)}` : undefined}
          request={{ kind: "collection_message", customerId }}
        />
      ) : null}
    </>
  );
};
