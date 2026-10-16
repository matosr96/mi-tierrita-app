import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTitaConversation, useTitaVoice } from "@/hooks/ai";
import { useSessionStore } from "@/stores/session";
import { useAiStore, type ActionState, type AiMessage } from "@/stores/ai";
import { ACCEPTED_FILES, fileToAttachment } from "@/lib/attachments";
import type { AiAction, AiAttachment, AiProposal, AiReportProposal, Role } from "@/types/api";
import { RichText } from "./RichText";
import { TitaAvatar } from "./TitaAvatar";
import styles from "./TitaConversation.module.css";

/** Preguntas de ejemplo por rol: lo que de verdad pregunta o pide cada puesto en la tienda. */
export const SUGGESTIONS: Record<Role, string[]> = {
  ADMIN: ["¿Cómo van las ventas de este mes frente al mes pasado?", "¿Qué debo reponer esta semana y cuánto?", "Súbale 200 pesos al precio de venta del arroz", "Genere el reporte de cartera"],
  SALES: ["¿Cuánto vendimos hoy y cuánto fue a crédito?", "¿A quién debo cobrar primero?", "Cree el cliente Pedro Gómez, cédula 1067889900", "Venda 2 arroz de contado"],
  WAREHOUSE: ["¿Qué lotes vencen esta semana?", "¿Qué productos se van a acabar pronto?", "Registre la compra de 24 leches que vencen en diciembre", "¿Qué productos no se están vendiendo?"],
};

const REPORT_PATH: Record<AiReportProposal["report"], string> = { sales: "sales", inventory: "inventory", receivables: "receivables" };

const STATUS_TEXT: Record<ActionState["status"], string> = { idle: "", running: "Registrando…", done: "Hecho", failed: "No se pudo", dismissed: "Descartado" };

/** Tarjeta de una acción: qué se hará, avisos, y Confirmar / Descartar. Solo al confirmar se llama a la API. */
const ActionCard = ({ a, state, onRun, onDismiss, onOpenScreen }: { a: AiAction; state: ActionState | undefined; onRun: () => void; onDismiss: () => void; onOpenScreen?: (() => void) | undefined }) => {
  const status = state?.status ?? "idle";
  return (
    <div className={[styles.card, styles[`card_${status}`]].join(" ")}>
      <div className={styles.cardHead}>
        <strong>{a.title}</strong>
        {status !== "idle" ? <span className={[styles.badge, styles[`badge_${status}`]].join(" ")}>{STATUS_TEXT[status]}</span> : null}
      </div>
      <ul className={styles.cardLines}>
        {a.lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {a.warnings.map((w) => (
        <p key={w} className={styles.warn}>
          {w}
        </p>
      ))}
      {state?.note && status !== "running" ? <p className={status === "failed" ? styles.failNote : styles.doneNote}>{status === "done" ? `Registrado: ${state.note}.` : state.note}</p> : null}
      {status === "idle" || status === "failed" ? (
        <div className={styles.cardActions}>
          <button type="button" className={styles.confirmBtn} onClick={onRun}>
            {status === "failed" ? "Intentar de nuevo" : a.confirmLabel}
          </button>
          {status === "idle" ? (
            <button type="button" className={styles.ghostBtn} onClick={onDismiss}>
              Descartar
            </button>
          ) : null}
          {onOpenScreen && status === "idle" ? (
            <button type="button" className={styles.linkBtn} onClick={onOpenScreen}>
              Revisar en su pantalla
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const ReportCard = ({ r, onOpen }: { r: AiReportProposal; onOpen: () => void }) => (
  <div className={styles.card}>
    <div className={styles.cardHead}>
      <strong>{r.title}</strong>
    </div>
    <ul className={styles.cardLines}>
      {r.lines.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
    <div className={styles.cardActions}>
      <button type="button" className={styles.confirmBtn} onClick={onOpen}>
        Abrir reporte
      </button>
      <span className={styles.cardHint}>Desde allí: imprimir en PDF o descargar en Excel</span>
    </div>
  </div>
);

const Attachments = ({ files }: { files: AiAttachment[] }) => (
  <ul className={styles.files}>
    {files.map((f) => (
      <li key={f.name}>{f.kind === "image" ? <img src={`data:image/jpeg;base64,${f.data}`} alt={f.name} /> : <span className={styles.fileName}>{f.name}</span>}</li>
    ))}
  </ul>
);

/**
 * Conversación con Tita (Claude por debajo). Responde con los datos reales del rol y puede hacer todo lo que esa cuenta
 * puede hacer en el sistema: cada escritura llega como tarjeta y solo se ejecuta si la persona la confirma, contra la
 * API real (mismos permisos, validaciones y auditoría). Acepta fotos y documentos, y conversación por voz.
 * La usan el panel rápido (`compact`) y la página /tita.
 */
export const TitaConversation = ({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) => {
  const user = useSessionStore((s) => s.user);
  const { messages, pending, send, run, dismiss } = useTitaConversation();
  const handOff = useAiStore((s) => s.handOff);
  const voice = useTitaVoice((text) => send(text));
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<AiAttachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uid = compact ? "panel" : "page";

  const ask = (text: string) => {
    if ((text.trim() === "" && files.length === 0) || pending) return;
    const attached = files;
    setDraft("");
    setFiles([]);
    void send(text, attached);
  };

  // Una pregunta que otra pantalla dejó lista (por ejemplo, desde una sugerencia del Inicio).
  useEffect(() => {
    const p = useAiStore.getState().takePrompt();
    if (p) ask(p);
    else inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, pending, voice.interim]);

  if (!user) return null;

  const go = (path: string) => {
    onNavigate?.();
    navigate(path);
  };
  const openReport = (r: AiReportProposal) => go(`/reportes?r=${REPORT_PATH[r.report]}&${new URLSearchParams(Object.entries(r.params).map(([k, v]) => [k, String(v)])).toString()}`);
  const openScreen = (a: AiAction) => {
    if (!a.handoff) return;
    handOff(a.handoff);
    go(a.handoff.type === "sale" ? "/ventas/nueva" : a.handoff.type === "payment" ? "/clientes" : "/proveedores");
  };

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (list.length === 0) return;
    setFileError(null);
    setReading(true);
    try {
      const next: AiAttachment[] = [];
      for (const f of list.slice(0, 4 - files.length)) next.push(await fileToAttachment(f));
      setFiles((prev) => [...prev, ...next].slice(0, 4));
      if (files.length + list.length > 4) setFileError("Se pueden adjuntar hasta 4 archivos por pregunta.");
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "No se pudo leer el archivo.");
    } finally {
      setReading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(draft);
    }
  };

  const proposalView = (m: AiMessage, p: AiProposal, i: number) =>
    p.type === "report" ? (
      <ReportCard key={i} r={p} onOpen={() => openReport(p)} />
    ) : (
      <ActionCard key={i} a={p} state={m.actions?.[i]} onRun={() => void run(m.id, i, p)} onDismiss={() => dismiss(m.id, i, p)} onOpenScreen={p.handoff ? () => openScreen(p) : undefined} />
    );

  return (
    <div className={[styles.conversation, compact ? styles.compact : styles.wide].join(" ")}>
      <ol className={styles.list} ref={listRef} aria-live="polite">
        {messages.length === 0 ? (
          <li className={styles.empty}>
            <TitaAvatar size={compact ? 56 : 76} />
            <p className={styles.hello}>
              Hola, {user.firstName}. Soy Tita.
              <br />
              ¿En qué le ayudo hoy?
            </p>
            <p className={styles.hint}>
              Pregúnteme lo que necesite del negocio o pídame que lo haga: crear clientes o productos, registrar ventas, abonos y compras, generar reportes… Usted
              confirma cada cosa. También puede enviarme fotos y documentos, o hablarme.
            </p>
            <div className={styles.suggestions}>
              {SUGGESTIONS[user.role].map((s) => (
                <button key={s} type="button" onClick={() => ask(s)}>
                  {s}
                </button>
              ))}
            </div>
          </li>
        ) : (
          messages.map((m) =>
            m.role === "event" ? (
              <li key={m.id} className={styles.event}>
                {m.content}
              </li>
            ) : m.role === "user" ? (
              <li key={m.id} className={styles.userRow}>
                {m.attachments ? <Attachments files={m.attachments} /> : null}
                <span className={styles.user}>{m.content}</span>
              </li>
            ) : (
              <li key={m.id} className={[styles.assistant, m.error ? styles.error : ""].join(" ")}>
                <TitaAvatar size={30} />
                <div className={styles.bubble}>
                  <RichText text={m.content} />
                  {m.proposals?.map((p, i) => proposalView(m, p, i))}
                  {m.sources && m.sources.length > 0 ? <p className={styles.sources}>Datos de: {m.sources.map((s) => s.label).join(" · ")}</p> : null}
                </div>
              </li>
            ),
          )
        )}
        {voice.interim ? <li className={[styles.userRow, styles.interim].join(" ")}>{voice.interim}</li> : null}
        {pending ? (
          <li className={styles.thinking}>
            <TitaAvatar size={30} thinking />
            <span>Tita está revisando los datos…</span>
          </li>
        ) : null}
      </ol>

      {files.length > 0 || fileError || reading ? (
        <div className={styles.pending}>
          {files.map((f) => (
            <span key={f.name} className={styles.chip}>
              {f.name}
              <button type="button" onClick={() => setFiles((prev) => prev.filter((x) => x !== f))} aria-label={`Quitar ${f.name}`}>
                ×
              </button>
            </span>
          ))}
          {reading ? <span className={styles.chipMuted}>Leyendo archivo…</span> : null}
          {fileError ? <span className={styles.fileError}>{fileError}</span> : null}
        </div>
      ) : null}

      {voice.state !== "off" ? (
        <div className={styles.live} role="status">
          <TitaAvatar size={34} thinking={voice.state === "thinking" || voice.state === "speaking"} />
          <span>{voice.state === "listening" ? "Escuchando… hable cuando quiera" : voice.state === "thinking" ? "Tita está revisando los datos…" : "Tita está respondiendo…"}</span>
          <button type="button" className={styles.ghostBtn} onClick={voice.stop}>
            Terminar
          </button>
        </div>
      ) : null}
      {voice.error ? <p className={styles.fileError}>{voice.error}</p> : null}

      <form className={styles.composer} onSubmit={onSubmit}>
        <input ref={fileRef} id={`tita-file-${uid}`} type="file" accept={ACCEPTED_FILES} multiple className={styles.srOnly} onChange={pick} />
        <button type="button" className={styles.toolBtn} onClick={() => fileRef.current?.click()} aria-label="Adjuntar foto o documento" title="Adjuntar foto o documento (PDF, Excel, CSV)">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M13.5 6.5 L7.6 12.4 a1.6 1.6 0 0 0 2.3 2.3 L16 8.6 a3.3 3.3 0 0 0 -4.6 -4.6 L5.3 10.1 a5 5 0 0 0 7.1 7.1 L17 12.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <label htmlFor={`tita-input-${uid}`} className={styles.srOnly}>
          Pregunta para Tita
        </label>
        <textarea
          id={`tita-input-${uid}`}
          ref={inputRef}
          rows={1}
          value={draft}
          placeholder={files.length > 0 ? "¿Qué hago con este archivo?" : "Escríbale a Tita…"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={2000}
        />
        {voice.supported ? (
          <button
            type="button"
            className={[styles.toolBtn, voice.state !== "off" ? styles.toolOn : ""].join(" ")}
            onClick={voice.state === "off" ? voice.start : voice.stop}
            aria-pressed={voice.state !== "off"}
            aria-label={voice.state === "off" ? "Hablar con Tita" : "Terminar la conversación por voz"}
            title="Hablar con Tita"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="7" y="2.5" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4.5 9.5 a5.5 5.5 0 0 0 11 0 M10 15 V17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
        <button type="submit" className={styles.sendBtn} disabled={(draft.trim() === "" && files.length === 0) || pending || reading}>
          Enviar
        </button>
      </form>
      <p className={styles.foot}>Las cifras salen del sistema. Nada se registra sin que usted lo confirme.</p>
    </div>
  );
};
