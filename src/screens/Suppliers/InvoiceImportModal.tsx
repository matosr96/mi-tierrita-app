import { useId, useState, type ChangeEvent, type DragEvent } from "react";
import { useReadInvoice } from "@/hooks/ai";
import { useProducts } from "@/hooks/products";
import { useRegisterPurchase, useSuppliers } from "@/hooks/suppliers";
import { dateOnly, int, money, todayIso } from "@/lib/format";
import type { ApiError } from "@/lib/errors";
import { Button, Callout, Checkbox, EmptyState, ErrorState, Field, Input, Loading, Modal, Select } from "@/components/ui";
import type { AiInvoiceLine, AiInvoiceReading, Product, Supplier } from "@/types/api";
import styles from "./InvoiceImportModal.module.css";

type Props = { onClose: () => void };

type Step = "photo" | "review" | "saving" | "done";

type LineForm = { include: boolean; productId: number | null; quantity: string; unitCost: string; expiresAt: string };

type LineErrors = Partial<Record<"productId" | "quantity" | "unitCost" | "expiresAt", string>>;

type LineResult = { index: number; productName: string; quantity: number; ok: boolean; message?: string };

/** Lado largo máximo de la foto que se envía y calidad JPEG: suficiente para leer la factura sin pesar de más. */
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.85;

/** Reduce la foto en un canvas y devuelve el data URL JPEG (para la miniatura) y el base64 sin prefijo (para la API). */
const downscale = (file: File): Promise<{ dataUrl: string; base64: string }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.max(1, Math.round(img.naturalWidth * scale));
      const height = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo procesar la imagen en este navegador."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      const comma = dataUrl.indexOf(",");
      resolve({ dataUrl, base64: comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo abrir la imagen. Intente con otra foto (JPEG o PNG)."));
    };
    img.src = url;
  });

const initialLine = (line: AiInvoiceLine): LineForm => {
  const first = line.candidates[0];
  return {
    include: first !== undefined,
    productId: first?.productId ?? null,
    quantity: line.quantity === null ? "" : String(line.quantity),
    unitCost: line.unitCost !== null ? String(line.unitCost) : first ? String(first.purchasePrice) : "",
    expiresAt: line.expiresAt ?? "",
  };
};

const validateLine = (form: LineForm, today: string): LineErrors => {
  const errs: LineErrors = {};
  const quantity = Number(form.quantity);
  const unitCost = Number(form.unitCost);
  if (form.productId === null) errs.productId = "Seleccione un producto.";
  if (!form.quantity || !Number.isInteger(quantity) || quantity <= 0) errs.quantity = "Cantidad entera mayor que cero.";
  if (form.unitCost === "" || !Number.isFinite(unitCost) || unitCost < 0) errs.unitCost = "Costo unitario válido.";
  if (!form.expiresAt) errs.expiresAt = "Ingrese la fecha de vencimiento.";
  else if (form.expiresAt < today) errs.expiresAt = "La fecha debe ser hoy o posterior.";
  return errs;
};

/** Leer factura con IA: foto → lectura del asistente → revisión de la persona → una compra (lote) por línea incluida. */
export const InvoiceImportModal = ({ onClose }: Props) => {
  const uid = useId();
  const read = useReadInvoice();
  const register = useRegisterPurchase();
  const suppliers = useSuppliers({ limit: 100, active: true });
  const products = useProducts({ active: true, limit: 100 });

  const [step, setStep] = useState<Step>("photo");
  const [photo, setPhoto] = useState<{ dataUrl: string; base64: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState<AiInvoiceReading | null>(null);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [lines, setLines] = useState<LineForm[]>([]);
  const [lineErrors, setLineErrors] = useState<LineErrors[]>([]);
  const [supplierError, setSupplierError] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<LineResult[]>([]);

  const today = todayIso();
  const catalog: Product[] = products.data?.items ?? [];
  const supplierList: Supplier[] = suppliers.data?.items ?? [];
  const includedCount = lines.filter((l) => l.include).length;

  const sendPhoto = async (base64: string) => {
    try {
      const result = await read.mutateAsync(base64);
      setReading(result);
      setSupplierId(result.supplier.match?.supplierId ?? null);
      setLines(result.lines.map(initialLine));
      setLineErrors(result.lines.map(() => ({})));
      setSupplierError(undefined);
      setStep("review");
    } catch {
      /* el error queda en la mutación y se muestra con un botón para reintentar */
    }
  };

  const takeFile = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    read.reset();
    if (!file.type.startsWith("image/")) {
      setPhotoError("El archivo no es una imagen. Tome o elija una foto de la factura.");
      return;
    }
    try {
      const shot = await downscale(file);
      setPhoto(shot);
      await sendPhoto(shot.base64);
    } catch (err) {
      setPhoto(null);
      setPhotoError(err instanceof Error ? err.message : "No se pudo abrir la imagen.");
    }
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    void takeFile(file);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (read.isPending) return;
    void takeFile(e.dataTransfer.files[0]);
  };

  const startOver = () => {
    read.reset();
    setPhoto(null);
    setPhotoError(null);
    setReading(null);
    setLines([]);
    setLineErrors([]);
    setStep("photo");
  };

  const patchLine = (index: number, patch: Partial<LineForm>) => {
    setLines((all) => all.map((l, i) => (i === index ? { ...l, ...patch } : l)));
    setLineErrors((all) => all.map((e, i) => (i === index ? {} : e)));
  };

  const pickProduct = (index: number, value: string) => {
    const id = value ? Number(value) : null;
    const current = lines[index];
    const line = reading?.lines[index];
    const price = line?.candidates.find((c) => c.productId === id)?.purchasePrice ?? catalog.find((p) => p.id === id)?.purchasePrice;
    // Si el asistente no leyó el costo y el campo sigue vacío, se sugiere el último precio de compra del producto.
    const unitCost = current && current.unitCost === "" && price !== undefined ? String(price) : undefined;
    patchLine(index, unitCost !== undefined ? { productId: id, unitCost } : { productId: id });
  };

  const productName = (index: number, productId: number | null): string => {
    const line = reading?.lines[index];
    return line?.candidates.find((c) => c.productId === productId)?.name ?? catalog.find((p) => p.id === productId)?.name ?? line?.description ?? "—";
  };

  const confirm = async () => {
    if (!reading) return;
    const errs = lines.map((l) => (l.include ? validateLine(l, today) : {}));
    const supErr = supplierId === null ? "Seleccione el proveedor de la factura." : undefined;
    setLineErrors(errs);
    setSupplierError(supErr);
    if (supErr || supplierId === null || errs.some((e) => Object.keys(e).length > 0) || includedCount === 0) return;

    const queue = lines.map((l, index) => ({ l, index })).filter(({ l }) => l.include);
    setStep("saving");
    setProgress(0);
    const out: LineResult[] = [];
    for (const { l, index } of queue) {
      const quantity = Number(l.quantity);
      const name = productName(index, l.productId);
      try {
        if (l.productId === null) throw new Error("Sin producto.");
        await register.mutateAsync({ supplierId, productId: l.productId, quantity, unitCost: Number(l.unitCost), expiresAt: l.expiresAt, aiSuggested: true, quiet: true });
        out.push({ index, productName: name, quantity, ok: true });
      } catch (err) {
        const message = (err as Partial<ApiError> | null)?.message ?? "No se pudo registrar.";
        out.push({ index, productName: name, quantity, ok: false, message });
      }
      setProgress(out.length);
    }
    setResults(out);
    setStep("done");
  };

  // ---------- Paso 3 y 4: registro y resumen ----------
  if (step === "saving" || step === "done") {
    const total = includedCount;
    const okCount = results.filter((r) => r.ok).length;
    const failCount = results.length - okCount;
    return (
      <Modal
        open
        wide
        title={step === "saving" ? "Registrando compras" : "Resultado de la factura"}
        description={step === "saving" ? "No cierre esta ventana hasta que termine." : undefined}
        onClose={step === "saving" ? () => undefined : onClose}
        footer={step === "done" ? <Button onClick={onClose}>Listo</Button> : null}
      >
        {step === "saving" ? (
          <div className={styles.progressBox} role="status" aria-live="polite">
            <span>
              Compra {int(Math.min(progress + 1, total))} de {int(total)}…
            </span>
            <div className={styles.progressTrack} role="progressbar" aria-label="Compras registradas" aria-valuemin={0} aria-valuemax={total} aria-valuenow={progress}>
              <div className={styles.progressFill} style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }} />
            </div>
          </div>
        ) : (
          <div className={styles.stack}>
            <Callout tone={failCount === 0 ? "good" : okCount === 0 ? "bad" : "warn"} title={failCount === 0 ? `${int(okCount)} ${okCount === 1 ? "compra registrada" : "compras registradas"}` : `${int(okCount)} de ${int(results.length)} compras registradas`}>
              {failCount === 0 ? "Cada compra creó su lote y el stock ya quedó actualizado." : "Las líneas con error no se registraron; puede registrarlas a mano con «Registrar compra»."}
            </Callout>
            <ul className={styles.results}>
              {results.map((r) => (
                <li key={r.index} className={[styles.result, r.ok ? styles.resultOk : styles.resultBad].join(" ")}>
                  <span className={styles.resultName}>
                    Línea {int(r.index + 1)} · {r.productName} · {int(r.quantity)} unidades
                  </span>
                  <span className={styles.resultStatus}>{r.ok ? "Registrada" : `No registrada: ${r.message ?? "error"}`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    );
  }

  // ---------- Paso 2: revisión ----------
  if (step === "review" && reading) {
    const loading = suppliers.isPending || products.isPending;
    const failed = suppliers.isError ? suppliers : products.isError ? products : null;
    const sup = reading.supplier;
    const readFacts = [
      sup.name ? { label: "Proveedor leído", value: sup.name, mono: false } : null,
      sup.taxId ? { label: "NIT", value: sup.taxId, mono: true } : null,
      reading.invoiceNumber ? { label: "Factura", value: reading.invoiceNumber, mono: true } : null,
      reading.invoiceDate ? { label: "Fecha", value: dateOnly(reading.invoiceDate), mono: false } : null,
    ].filter((f): f is { label: string; value: string; mono: boolean } => f !== null);

    return (
      <Modal
        open
        wide
        title="Revisar factura"
        description="Verifique cada línea antes de registrar. Solo se registran las líneas marcadas."
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={startOver}>
              Otra foto
            </Button>
            <Button onClick={() => void confirm()} disabled={loading || failed !== null || includedCount === 0}>
              {includedCount === 1 ? "Registrar 1 compra" : `Registrar ${int(includedCount)} compras`}
            </Button>
          </>
        }
      >
        {loading ? (
          <Loading text="Cargando proveedores y catálogo…" inline />
        ) : failed ? (
          <ErrorState error={failed.error} onRetry={() => failed.refetch()} />
        ) : (
          <div className={styles.stack}>
            {reading.notes ? (
              <Callout tone="warn" title="Observaciones de Tita">
                {reading.notes}
              </Callout>
            ) : null}

            <section className={styles.supplierBox} aria-label="Proveedor de la factura">
              <Field label="Proveedor" htmlFor={`${uid}-supplier`} error={supplierError} hint={sup.match ? `Reconocido como ${sup.match.name}` : "Tita no reconoció el proveedor; selecciónelo."}>
                <Select
                  id={`${uid}-supplier`}
                  value={supplierId ?? ""}
                  onChange={(e) => {
                    setSupplierId(e.target.value ? Number(e.target.value) : null);
                    setSupplierError(undefined);
                  }}
                  invalid={Boolean(supplierError)}
                >
                  <option value="">Seleccione…</option>
                  {supplierList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.taxId ? ` · ${s.taxId}` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              {readFacts.length > 0 ? (
                <dl className={styles.facts}>
                  {readFacts.map((f) => (
                    <div key={f.label} className={styles.fact}>
                      <dt>{f.label}</dt>
                      <dd className={f.mono ? styles.mono : undefined}>{f.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </section>

            {reading.lines.length === 0 ? (
              <EmptyState title="No se encontraron productos" text="Tita no pudo leer líneas en la factura. Tome otra foto más nítida o registre la compra a mano." />
            ) : (
              <ol className={styles.lines}>
                {reading.lines.map((line, i) => {
                  const form = lines[i];
                  if (!form) return null;
                  const errs = lineErrors[i] ?? {};
                  const candidateIds = new Set(line.candidates.map((c) => c.productId));
                  const rest = catalog.filter((p) => !candidateIds.has(p.id));
                  const base = `${uid}-line-${i}`;
                  return (
                    <li key={i} className={[styles.line, form.include ? "" : styles.lineOff].join(" ")}>
                      <div className={styles.lineHead}>
                        <Checkbox label={`Incluir línea ${i + 1}`} checked={form.include} onChange={(e) => patchLine(i, { include: e.target.checked })} />
                        <span className={styles.readText}>
                          Leído: {line.description || "—"}
                          {line.lot ? (
                            <>
                              {" · lote "}
                              <span className={styles.mono}>{line.lot}</span>
                            </>
                          ) : null}
                        </span>
                      </div>
                      {form.include ? (
                        <div className={styles.lineGrid}>
                          <div className={styles.productCell}>
                            <Field label="Producto" htmlFor={`${base}-product`} error={errs.productId} hint={line.candidates.length === 0 ? "Sin coincidencias en el catálogo" : undefined}>
                              <Select id={`${base}-product`} value={form.productId ?? ""} onChange={(e) => pickProduct(i, e.target.value)} invalid={Boolean(errs.productId)}>
                                <option value="">Seleccione…</option>
                                {line.candidates.length > 0 ? (
                                  <optgroup label="Sugeridos por Tita">
                                    {line.candidates.map((c) => (
                                      <option key={c.productId} value={c.productId}>
                                        {c.name} · {c.sku}
                                      </option>
                                    ))}
                                  </optgroup>
                                ) : null}
                                <optgroup label="Catálogo activo">
                                  {rest.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} · {p.sku}
                                    </option>
                                  ))}
                                </optgroup>
                              </Select>
                            </Field>
                          </div>
                          <Field label="Cantidad" htmlFor={`${base}-quantity`} error={errs.quantity}>
                            <Input id={`${base}-quantity`} type="number" min={1} step={1} inputMode="numeric" value={form.quantity} onChange={(e) => patchLine(i, { quantity: e.target.value })} invalid={Boolean(errs.quantity)} />
                          </Field>
                          <Field label="Costo unitario" htmlFor={`${base}-cost`} error={errs.unitCost} hint={line.unitCost === null ? "No se leyó en la factura: se sugiere el último costo" : `Leído: ${money(line.unitCost)}`}>
                            <Input id={`${base}-cost`} type="number" min={0} step="any" inputMode="decimal" value={form.unitCost} onChange={(e) => patchLine(i, { unitCost: e.target.value })} invalid={Boolean(errs.unitCost)} />
                          </Field>
                          <Field label="Vencimiento" htmlFor={`${base}-expires`} error={errs.expiresAt}>
                            <Input id={`${base}-expires`} type="date" min={today} value={form.expiresAt} onChange={(e) => patchLine(i, { expiresAt: e.target.value })} invalid={Boolean(errs.expiresAt)} />
                          </Field>
                        </div>
                      ) : null}
                      {line.warnings.length > 0 ? (
                        <ul className={styles.warnings}>
                          {line.warnings.map((w, k) => (
                            <li key={k}>{w}</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
      </Modal>
    );
  }

  // ---------- Paso 1: foto ----------
  const error = read.error;
  return (
    <Modal
      open
      wide
      title="Leer factura con IA"
      description="Tome una foto nítida de la factura completa; Tita lee productos, cantidades, costos y vencimientos. Nada se registra hasta que usted confirme."
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
      }
    >
      <div className={styles.stack}>
        {read.isPending ? (
          <div className={styles.readingBox}>
            {photo ? <img className={styles.thumb} src={photo.dataUrl} alt="Foto de la factura enviada" /> : null}
            <Loading text="Leyendo la factura…" inline />
          </div>
        ) : (
          <>
            <label
              className={[styles.drop, dragging ? styles.dropActive : ""].join(" ")}
              htmlFor={`${uid}-file`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input id={`${uid}-file`} className={styles.fileInput} type="file" accept="image/*" capture="environment" onChange={onFile} />
              {photo ? (
                <img className={styles.thumb} src={photo.dataUrl} alt="Foto de la factura" />
              ) : (
                <svg className={styles.dropIcon} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <rect x="5" y="11" width="30" height="21" rx="4" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M14 11 L16.5 7 H23.5 L26 11" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <circle cx="20" cy="21.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              )}
              <span className={styles.dropTitle}>{photo ? "Tomar o elegir otra foto" : "Tomar foto de la factura"}</span>
              <span className={styles.dropHint}>En el celular se abre la cámara; en el computador puede elegir o arrastrar una imagen.</span>
            </label>
            {photoError ? <Callout tone="bad">{photoError}</Callout> : null}
            {error && photo ? (
              <Callout
                tone="bad"
                title="No se pudo leer la factura"
                aside={
                  <Button variant="secondary" size="sm" onClick={() => void sendPhoto(photo.base64)}>
                    Reintentar
                  </Button>
                }
              >
                {error.message}
              </Callout>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
};
