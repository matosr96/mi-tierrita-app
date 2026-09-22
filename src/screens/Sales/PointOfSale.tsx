import { useState, type ReactNode } from "react";
import { useProducts } from "@/hooks/products";
import { useCustomerBalance, useCustomers } from "@/hooks/customers";
import { useRegisterSale } from "@/hooks/sales";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Button, Callout, Card, DataTable, EmptyState, ErrorState, Field, Input, Loading, Modal, QueryState, Select, type Column } from "@/components/ui";
import { int, money } from "@/lib/format";
import type { ApiError } from "@/lib/errors";
import type { PaymentType, Product, SaleDetail, SaleLine } from "@/types/api";
import { useDebounced } from "./useDebounced";
import styles from "./SalesScreen.module.css";

type CartLine = { product: Product; quantity: number };

const PAYMENT_LABELS: Record<PaymentType, string> = { CASH: "Contado", CREDIT: "Crédito" };

const asRecord = (value: unknown): Record<string, unknown> => (typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
const asNumber = (value: unknown): number | null => (typeof value === "number" ? value : null);

/** Detalles legibles de los errores de dominio del registro de venta (620 stock, 621 cupo). */
const errorDetails = (err: ApiError, cart: CartLine[]): string | null => {
  const d = asRecord(err.details);
  if (err.code === "620") {
    const productId = asNumber(d.productId);
    const name = cart.find((l) => l.product.id === productId)?.product.name;
    return `Disponible: ${int(asNumber(d.available))}${name ? ` · ${name}` : productId !== null ? ` · producto #${productId}` : ""}`;
  }
  if (err.code === "621") return `Cupo: ${money(asNumber(d.creditLimit))} · Saldo: ${money(asNumber(d.balance))} · Total de la venta: ${money(asNumber(d.total))}`;
  return null;
};

/** Etiqueta de disponibilidad del lienzo: "bajo" en rojo junto a la cantidad. */
const stockTag = (stock: number) => (stock <= 0 ? <Badge tone="bad">sin stock</Badge> : stock < 5 ? <Badge tone="bad">bajo</Badge> : null);

const SearchIcon = () => (
  <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="8.8" cy="8.8" r="6" stroke="currentColor" strokeWidth="1.7" />
    <line x1="13.2" y1="13.2" x2="17.5" y2="17.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/** CU-09 (lienzo "Punto de venta"): el servidor congela precios, calcula el total y descuenta stock por FEFO; aquí solo se arma el pedido. */
export const PointOfSale = ({ tabs }: { tabs: ReactNode }) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search.trim());
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [result, setResult] = useState<SaleDetail | null>(null);

  const products = useProducts(debouncedSearch ? { search: debouncedSearch, active: true, limit: 20 } : { active: true, limit: 20 });
  const customers = useCustomers({ active: true, limit: 100 });
  const balance = useCustomerBalance(customerId);
  const registerSale = useRegisterSale();

  /** Única suma del cliente: vista previa estimada del carrito (el total real lo devuelve la API). */
  const estimated = cart.reduce((sum, l) => sum + l.quantity * l.product.salePrice, 0);
  const creditNeedsCustomer = paymentType === "CREDIT" && customerId === null;
  const creditExceeded = paymentType === "CREDIT" && balance.data !== undefined && estimated > balance.data.availableCredit;
  const canConfirm = cart.length > 0 && !creditNeedsCustomer && !registerSale.isPending;

  const addToCart = (product: Product) => {
    registerSale.reset();
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (!existing) return [...prev, { product, quantity: 1 }];
      return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: Math.min(l.quantity + 1, product.stock) } : l));
    });
  };
  const setQuantity = (productId: number, raw: string) => {
    const value = Math.floor(Number(raw));
    setCart((prev) => prev.map((l) => (l.product.id === productId ? { ...l, quantity: Number.isFinite(value) && value > 0 ? Math.min(value, l.product.stock) : 1 } : l)));
  };
  const removeLine = (productId: number) => setCart((prev) => prev.filter((l) => l.product.id !== productId));

  const selectCustomer = (raw: string) => {
    const id = raw === "" ? null : Number(raw);
    setCustomerId(id);
    if (id === null) setPaymentType("CASH");
    registerSale.reset();
  };

  const confirm = async () => {
    const input = { paymentType, lines: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })), ...(customerId !== null ? { customerId } : {}) };
    await registerSale.mutateAsync(input).then(
      (sale) => {
        setResult(sale);
        setCart([]);
      },
      () => undefined,
    );
  };

  const resultColumns: Column<Product>[] = [
    { key: "sku", header: "Código", render: (p) => <span className={styles.mono}>{p.sku}</span> },
    { key: "name", header: "Producto", render: (p) => p.name },
    {
      key: "stock",
      header: "Disponible",
      align: "right",
      render: (p) => (
        <span className={styles.stockCell}>
          {int(p.stock)}
          {stockTag(p.stock)}
        </span>
      ),
    },
    { key: "price", header: "Precio", align: "right", render: (p) => money(p.salePrice) },
    {
      key: "add",
      header: "",
      align: "right",
      width: "1%",
      render: (p) => {
        const inCart = cart.find((l) => l.product.id === p.id);
        return (
          <Button variant="secondary" size="sm" className={styles.addBtn} disabled={p.stock <= 0 || (inCart !== undefined && inCart.quantity >= p.stock)} onClick={() => addToCart(p)}>
            Agregar
          </Button>
        );
      },
    },
  ];

  const cartColumns: Column<CartLine>[] = [
    { key: "name", header: "Producto", render: (l) => l.product.name },
    {
      key: "qty",
      header: "Cant.",
      align: "right",
      width: "90px",
      render: (l) => (
        <div className={styles.qty}>
          <Input type="number" min={1} max={l.product.stock} step={1} value={l.quantity} aria-label={`Cantidad de ${l.product.name}`} onChange={(e) => setQuantity(l.product.id, e.target.value)} />
        </div>
      ),
    },
    { key: "price", header: "Precio", align: "right", render: (l) => money(l.product.salePrice) },
    { key: "subtotal", header: "Subtotal", align: "right", render: (l) => money(l.quantity * l.product.salePrice) },
    {
      key: "remove",
      header: "",
      align: "right",
      width: "1%",
      render: (l) => (
        <Button variant="ghost" size="sm" onClick={() => removeLine(l.product.id)} aria-label={`Quitar ${l.product.name}`}>
          Quitar
        </Button>
      ),
    },
  ];

  const lineColumns: Column<SaleLine>[] = [
    { key: "sku", header: "Código", render: (l) => <span className={styles.mono}>{l.sku}</span> },
    { key: "name", header: "Producto", render: (l) => l.productName },
    { key: "qty", header: "Cant.", align: "right", render: (l) => int(l.quantity) },
    { key: "price", header: "Precio", align: "right", render: (l) => money(l.unitPrice) },
    { key: "total", header: "Subtotal", align: "right", render: (l) => money(l.lineTotal) },
  ];

  const resultsCount = products.data ? (products.data.count === 1 ? "1 resultado" : `${int(products.data.count)} resultados`) : null;
  const errorText = registerSale.error ? errorDetails(registerSale.error, cart) : null;

  return (
    <>
      <PageHeader title="Punto de venta" subtitle="Los productos descuentan del inventario al confirmar." actions={tabs} />

      <div className={styles.layout}>
        <div className={styles.column}>
          <div className={styles.searchBox}>
            <SearchIcon />
            <label htmlFor="pos-search" className={styles.srOnly}>
              Buscar producto
            </label>
            <input id="pos-search" type="text" className={styles.searchInput} placeholder="Buscar producto por nombre o código" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
            {resultsCount ? <span className={styles.searchCount}>{resultsCount}</span> : null}
          </div>

          <Card title="Resultados" subtitle="Toque un producto para agregarlo">
            <QueryState
              query={products}
              isEmpty={(page) => page.items.length === 0}
              empty={<EmptyState title="Sin productos" text={debouncedSearch ? `Ningún producto activo coincide con “${debouncedSearch}”.` : "No hay productos activos en el inventario."} />}
            >
              {(page) => <DataTable columns={resultColumns} rows={page.items} rowKey={(p) => p.id} />}
            </QueryState>
          </Card>

          <Card title="Carrito" subtitle={cart.length === 0 ? "Sin productos" : `${int(cart.length)} ${cart.length === 1 ? "producto" : "productos"}`} className={styles.grow}>
            {cart.length === 0 ? (
              <EmptyState title="El carrito está vacío" text="Busque un producto arriba y agréguelo para empezar la venta." />
            ) : (
              <DataTable columns={cartColumns} rows={cart} rowKey={(l) => l.product.id} />
            )}
          </Card>
        </div>

        <div className={[styles.column, styles.sideColumn].join(" ")}>
          <Card title="Cliente">
            <div className={styles.customerFields}>
              <Field label="Cliente" htmlFor="pos-customer">
                {customers.isPending ? (
                  <Loading inline text="Cargando clientes…" />
                ) : customers.isError ? (
                  <ErrorState error={customers.error} onRetry={() => customers.refetch()} />
                ) : (
                  <Select id="pos-customer" value={customerId ?? ""} onChange={(e) => selectCustomer(e.target.value)}>
                    <option value="">Consumidor final</option>
                    {customers.data.items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              {customerId !== null ? (
                balance.isPending ? (
                  <Loading inline text="Consultando cartera…" />
                ) : balance.isError ? (
                  <ErrorState error={balance.error} onRetry={() => balance.refetch()} />
                ) : (
                  <div className={styles.creditBox}>
                    <div className={styles.creditRow}>
                      <span>Cupo autorizado</span>
                      <strong>{money(balance.data.creditLimit)}</strong>
                    </div>
                    <div className={styles.creditRow}>
                      <span>Saldo actual</span>
                      <strong>{money(balance.data.balance)}</strong>
                    </div>
                    <div className={[styles.creditRow, styles.creditMain].join(" ")}>
                      <span>Disponible</span>
                      <strong>{money(balance.data.availableCredit)}</strong>
                    </div>
                    {creditExceeded ? (
                      <div className={styles.creditWarning}>
                        Esta venta supera el cupo disponible en {money(estimated - balance.data.availableCredit)}. Cobre de contado o pida autorización al administrador.
                      </div>
                    ) : balance.data.overdue ? (
                      <div className={styles.creditOverdue}>Cartera vencida: {int(balance.data.overdueDays)} días sin abonar.</div>
                    ) : null}
                  </div>
                )
              ) : null}

              <Field label="Forma de pago" htmlFor="pos-payment" hint={creditNeedsCustomer ? "Para vender a crédito seleccione un cliente." : undefined}>
                <Select id="pos-payment" value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)}>
                  <option value="CASH">{PAYMENT_LABELS.CASH}</option>
                  <option value="CREDIT" disabled={customerId === null}>
                    {PAYMENT_LABELS.CREDIT}
                  </option>
                </Select>
              </Field>
            </div>
          </Card>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{money(estimated)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Forma de pago</span>
              <span>{PAYMENT_LABELS[paymentType]}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <strong>{money(estimated)}</strong>
            </div>
            {registerSale.error ? (
              <div className={styles.summaryError}>
                <Callout tone="bad">
                  <strong>{registerSale.error.message}</strong>
                  {errorText ? <span className={styles.errorDetails}>{errorText}</span> : null}
                </Callout>
              </div>
            ) : null}
            <Button variant="accent" size="lg" block className={styles.confirmBtn} loading={registerSale.isPending} disabled={!canConfirm} onClick={confirm}>
              Confirmar venta
            </Button>
            <div className={styles.summaryNote}>Total estimado: el definitivo lo calcula el servidor al confirmar.</div>
          </div>
        </div>
      </div>

      <Modal
        open={result !== null}
        title={result ? `Venta ${result.invoiceNumber} registrada` : ""}
        description="El inventario y la cartera ya quedaron actualizados."
        onClose={() => setResult(null)}
        wide
        footer={
          <Button onClick={() => setResult(null)} autoFocus>
            Nueva venta
          </Button>
        }
      >
        {result ? (
          <div className={styles.section}>
            <div className={styles.factGrid}>
              <div className={styles.fact}>
                <span className={styles.factLabel}>Cliente</span>
                <span className={styles.factValue}>{result.customerName ?? "Consumidor final"}</span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factLabel}>Forma de pago</span>
                <span className={styles.factValue}>{PAYMENT_LABELS[result.paymentType]}</span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factLabel}>Registró</span>
                <span className={styles.factValue}>{result.username}</span>
              </div>
            </div>
            <DataTable columns={lineColumns} rows={result.lines} rowKey={(l) => l.id} />
            <div className={styles.total}>
              <span>Total</span>
              <strong>{money(result.total)}</strong>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
};
