import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Badge, Button, Callout, Chips, EmptyState, Input, Modal, QueryState, StatCard, StatGrid } from "@/components/ui";
import { useCancelStockCount, useSaveStockCountLines, useStartStockCount, useStockCount, useSubmitStockCount } from "@/hooks/stock-counts";
import { dateOnly, dateTime, int } from "@/lib/format";
import { useSessionStore } from "@/stores/session";
import type { StockCountDetail, StockCountLine, StockCountLineInput } from "@/types/api";
import { STATUS_LABELS, STATUS_TONES, plural, scopeLabel, signed } from "./stockCountLabels";
import styles from "./StockCountsScreen.module.css";

type Props = { id: number; onBack: () => void; onEdit: (count: StockCountDetail) => void; onReview: (id: number) => void };

type LineFilter = "all" | "pending" | "diff";
const FILTERS: { value: LineFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Sin contar" },
  { value: "diff", label: "Con diferencia" },
];

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Lo escrito en un cuadro: vacío = sin contar; si no, un entero de cero en adelante. */
const parseCount = (raw: string): { ok: true; value: number | null } | { ok: false } => {
  const text = raw.trim();
  if (text === "") return { ok: true, value: null };
  return /^\d{1,7}$/.test(text) ? { ok: true, value: Number(text) } : { ok: false };
};

type Confirm = null | "submit" | "cancel";

/** Hoja de conteo: un renglón por producto con el cuadro numérico grande (bodega la usa de pie, en el celular). */
export const CountSheet = ({ id, onBack, onEdit, onReview }: Props) => {
  const query = useStockCount(id);
  const role = useSessionStore((s) => s.user?.role);
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LineFilter>("all");
  const [confirm, setConfirm] = useState<Confirm>(null);
  const start = useStartStockCount();
  const save = useSaveStockCountLines();
  const submit = useSubmitStockCount();
  const cancel = useCancelStockCount();

  const dirtyIds = Object.keys(draft).map(Number);
  const invalidIds = new Set(dirtyIds.filter((pid) => !parseCount(draft[pid] ?? "").ok));

  const pendingInput = (count: StockCountDetail): StockCountLineInput[] =>
    dirtyIds
      .map((pid) => ({ pid, parsed: parseCount(draft[pid] ?? "") }))
      .filter((d): d is { pid: number; parsed: { ok: true; value: number | null } } => d.parsed.ok)
      .filter((d) => count.lines.find((l) => l.productId === d.pid)?.countedQuantity !== d.parsed.value)
      .map((d) => ({ productId: d.pid, countedQuantity: d.parsed.value }));

  const saveDraft = async (count: StockCountDetail): Promise<boolean> => {
    const lines = pendingInput(count);
    if (lines.length === 0) {
      setDraft({});
      return true;
    }
    try {
      await save.mutateAsync({ id: count.id, lines });
      setDraft({});
      return true;
    } catch {
      return false;
    }
  };

  const doSubmit = async (count: StockCountDetail) => {
    if (!(await saveDraft(count))) return;
    await submit.mutateAsync(count.id).then(() => setConfirm(null), () => setConfirm(null));
  };

  const focusNext = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const inputs = [...document.querySelectorAll<HTMLInputElement>("[data-count-input]")];
    const next = inputs[inputs.indexOf(e.currentTarget) + 1];
    if (next) next.focus();
    else e.currentTarget.blur();
  };

  return (
    <QueryState query={query} empty={null}>
      {(count) => (
        <SheetBody
          count={count}
          role={role}
          draft={draft}
          invalidIds={invalidIds}
          search={search}
          filter={filter}
          onSearch={setSearch}
          onFilter={setFilter}
          onDraft={(pid, value) => setDraft((prev) => ({ ...prev, [pid]: value }))}
          onKeyDown={focusNext}
          onBack={onBack}
          onEdit={() => onEdit(count)}
          onReview={() => onReview(count.id)}
          onStart={() => start.mutate(count.id)}
          onSave={() => void saveDraft(count)}
          onAskSubmit={() => setConfirm("submit")}
          onAskCancel={() => setConfirm("cancel")}
          dirtyCount={pendingInput(count).length}
          starting={start.isPending}
          saving={save.isPending}
          confirmNode={
            confirm === null ? null : (
              <Modal
                open
                title={confirm === "submit" ? "Enviar el conteo" : "Cancelar el conteo"}
                onClose={() => setConfirm(null)}
                footer={
                  <>
                    <Button variant="secondary" onClick={() => setConfirm(null)} disabled={submit.isPending || cancel.isPending || save.isPending}>
                      Volver
                    </Button>
                    {confirm === "submit" ? (
                      <Button loading={submit.isPending || save.isPending} onClick={() => void doSubmit(count)}>
                        Enviar
                      </Button>
                    ) : (
                      <Button variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate(count.id, { onSettled: () => setConfirm(null) })}>
                        Cancelar conteo
                      </Button>
                    )}
                  </>
                }
              >
                <p className={styles.confirmText}>
                  {confirm === "submit"
                    ? "Se guardan los cambios pendientes y el conteo pasa a la administración para aprobar el ajuste. Después de enviarlo no podrá cambiar las cantidades."
                    : "El conteo queda cancelado y no se mueve ninguna existencia. Esta acción no se puede deshacer."}
                </p>
              </Modal>
            )
          }
        />
      )}
    </QueryState>
  );
};

type BodyProps = {
  count: StockCountDetail;
  role: string | undefined;
  draft: Record<number, string>;
  invalidIds: Set<number>;
  search: string;
  filter: LineFilter;
  onSearch: (v: string) => void;
  onFilter: (v: LineFilter) => void;
  onDraft: (productId: number, value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onEdit: () => void;
  onReview: () => void;
  onStart: () => void;
  onSave: () => void;
  onAskSubmit: () => void;
  onAskCancel: () => void;
  dirtyCount: number;
  starting: boolean;
  saving: boolean;
  confirmNode: ReactNode;
};

const SheetBody = (p: BodyProps) => {
  const { count } = p;
  const editable = count.status === "IN_PROGRESS";
  const lines = useMemo(() => {
    const term = normalize(p.search.trim());
    return count.lines.filter((l) => {
      if (term && !normalize(`${l.productName} ${l.sku}`).includes(term)) return false;
      if (p.filter === "pending") return l.countedQuantity === null;
      if (p.filter === "diff") return (l.difference ?? 0) !== 0;
      return true;
    });
  }, [count.lines, p.search, p.filter]);

  const history = [
    count.startedAt ? `Iniciado ${dateTime(count.startedAt)} por ${count.startedByName ?? "—"}` : null,
    count.submittedAt ? `Enviado ${dateTime(count.submittedAt)} por ${count.submittedByName ?? "—"}` : null,
    count.appliedAt ? `Ajuste aplicado ${dateTime(count.appliedAt)} por ${count.appliedByName ?? "—"}` : null,
    count.cancelledAt ? `Cancelado ${dateTime(count.cancelledAt)} por ${count.cancelledByName ?? "—"}` : null,
  ].filter((h): h is string => h !== null);

  return (
    <div className={styles.sheet}>
      <div className={styles.sheetHead}>
        <Button variant="ghost" size="sm" onClick={p.onBack}>
          Volver a la lista
        </Button>
        <div className={styles.sheetTitleRow}>
          <h2 className={styles.sheetTitle}>{count.title}</h2>
          <Badge tone={STATUS_TONES[count.status]}>{STATUS_LABELS[count.status]}</Badge>
          {count.due === "OVERDUE" ? <Badge tone="bad">Atrasado</Badge> : count.due === "TODAY" ? <Badge tone="warn">Para hoy</Badge> : null}
        </div>
        <p className={styles.sheetMeta}>
          {dateOnly(count.scheduledDate)} · {scopeLabel(count)} · programado por {count.createdByName}
        </p>
        {count.note ? <p className={styles.sheetNote}>{count.note}</p> : null}
        {history.length > 0 ? <p className={styles.sheetMeta}>{history.join(" · ")}</p> : null}
      </div>

      {count.status === "PLANNED" ? (
        <Callout tone="neutral" title="Listo para iniciar">
          <p className={styles.calloutText}>Al iniciar, el sistema toma el stock de cada producto activo del alcance como punto de partida y abre la hoja de conteo.</p>
          <div className={styles.calloutActions}>
            <Button loading={p.starting} onClick={p.onStart}>
              Iniciar conteo
            </Button>
            <Button variant="secondary" onClick={p.onEdit}>
              Editar
            </Button>
            <Button variant="ghost" onClick={p.onAskCancel}>
              Cancelar conteo
            </Button>
          </div>
        </Callout>
      ) : null}

      {count.status === "SUBMITTED" ? (
        p.role === "ADMIN" ? (
          <Callout tone="warn" title="Pendiente de aprobación">
            <p className={styles.calloutText}>Revise los faltantes y sobrantes contra el stock actual antes de aplicar el ajuste de existencias.</p>
            <div className={styles.calloutActions}>
              <Button onClick={p.onReview}>Revisar y aplicar ajuste</Button>
            </div>
          </Callout>
        ) : (
          <Callout tone="warn" title="Enviado a la administración">
            El ajuste de existencias lo aprueba y aplica la administración.
          </Callout>
        )
      ) : null}

      {count.status !== "PLANNED" ? (
        <>
          <StatGrid>
            <StatCard label="Contados" value={`${int(count.summary.countedLines)} de ${int(count.summary.totalLines)}`} hint={count.summary.pendingLines > 0 ? `${int(count.summary.pendingLines)} sin contar` : "Todos contados"} tone={count.summary.pendingLines > 0 ? "warn" : "good"} />
            <StatCard label="Con diferencia" value={int(count.summary.linesWithDifference)} hint="Productos contra el stock al iniciar" />
            <StatCard label="Faltantes" value={int(count.summary.shortageUnits)} hint="Unidades" tone={count.summary.shortageUnits > 0 ? "bad" : "neutral"} />
            <StatCard label="Sobrantes" value={int(count.summary.surplusUnits)} hint="Unidades" tone={count.summary.surplusUnits > 0 ? "warn" : "neutral"} />
          </StatGrid>

          <div className={styles.sheetTools}>
            <Input className={styles.search} type="search" value={p.search} onChange={(e) => p.onSearch(e.target.value)} placeholder="Buscar producto o SKU" aria-label="Buscar producto o SKU" />
            <Chips options={FILTERS} value={p.filter} onChange={p.onFilter} />
          </div>

          {lines.length === 0 ? (
            <EmptyState title="Ningún producto coincide" text="Cambie la búsqueda o el filtro." />
          ) : (
            <ul className={styles.lines}>
              {lines.map((line) => (
                <LineRow key={line.id} line={line} editable={editable} value={p.draft[line.productId]} invalid={p.invalidIds.has(line.productId)} onChange={(v) => p.onDraft(line.productId, v)} onKeyDown={p.onKeyDown} applied={count.status === "APPLIED"} />
              ))}
            </ul>
          )}

          {editable ? (
            <div className={styles.stickyBar}>
              <span className={styles.stickyInfo}>{p.invalidIds.size > 0 ? "Hay cantidades no válidas" : p.dirtyCount > 0 ? `${plural(p.dirtyCount, "cambio", "cambios")} sin guardar` : "Todo guardado"}</span>
              <div className={styles.actionsRow}>
                <Button variant="ghost" onClick={p.onAskCancel}>
                  Cancelar
                </Button>
                <Button variant="secondary" loading={p.saving} disabled={p.dirtyCount === 0 || p.invalidIds.size > 0} onClick={p.onSave}>
                  Guardar avance
                </Button>
                <Button disabled={p.invalidIds.size > 0 || p.saving} onClick={p.onAskSubmit}>
                  Enviar
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {p.confirmNode}
    </div>
  );
};

type LineProps = {
  line: StockCountLine;
  editable: boolean;
  value: string | undefined;
  invalid: boolean;
  applied: boolean;
  onChange: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
};

const LineRow = ({ line, editable, value, invalid, applied, onChange, onKeyDown }: LineProps) => {
  const dirty = value !== undefined && value !== (line.countedQuantity === null ? "" : String(line.countedQuantity));
  const diff = applied ? line.appliedDifference : line.difference;
  const diffClass = dirty || diff === null || diff === 0 ? "" : diff < 0 ? styles.diffBad : styles.diffWarn;
  const inputId = `count-line-${line.productId}`;
  return (
    <li className={styles.line}>
      <label className={styles.lineInfo} htmlFor={inputId}>
        <span className={styles.lineName}>{line.productName}</span>
        <span className={styles.lineMeta}>
          <span className={styles.sku}>{line.sku}</span> · Sistema {int(line.expectedQuantity)}
        </span>
        <span className={[styles.lineDiff, diffClass].join(" ")}>
          {dirty ? "Sin guardar" : diff === null ? "Sin contar" : diff === 0 ? "Cuadra" : `${applied ? "Ajuste" : "Diferencia"} ${signed(diff)}`}
        </span>
      </label>
      {editable ? (
        <input
          id={inputId}
          data-count-input
          className={styles.countInput}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="next"
          value={value ?? (line.countedQuantity === null ? "" : String(line.countedQuantity))}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-invalid={invalid}
          aria-label={`Cantidad contada de ${line.productName}`}
          placeholder="—"
        />
      ) : (
        <span className={styles.countValue} id={inputId}>
          {line.countedQuantity === null ? "—" : int(line.countedQuantity)}
        </span>
      )}
    </li>
  );
};
