import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui";
import { useUploadChatAttachment, type ChatDraft } from "@/hooks/chat";
import { notify } from "@/stores/toasts";
import type { ChatAttachment, ChatMessage } from "@/types/api";
import { bodyOrFiles, durationLabel, normalize, sizeLabel } from "./chatFormat";
import styles from "./Composer.module.css";

export type MentionCandidate = { id: number; username: string; firstName: string; lastName: string };

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,audio/webm,audio/ogg,audio/mp4,audio/mpeg,.m4a,.mp3,application/pdf,text/plain,text/csv,.csv,.xlsx,.xls,.docx,.doc";
/** Tope de una nota de voz grabada aquí (se detiene sola). */
const RECORD_MAX_MS = 5 * 60_000;

/** Formato que el navegador sabe grabar: WebM/Opus (Chrome, Firefox), si no MP4 (Safari); null si no graba. */
const recordingMime = (): string | null => {
  if (typeof MediaRecorder === "undefined" || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return null;
  for (const mime of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) if (MediaRecorder.isTypeSupported(mime)) return mime;
  return null;
};
const RECORD_MIME = recordingMime();
const recordingExt = (mime: string): string => (mime.startsWith("audio/mp4") ? "m4a" : mime.startsWith("audio/ogg") ? "ogg" : "webm");

type Recording = { recorder: MediaRecorder; stream: MediaStream; chunks: Blob[]; startedAt: number; cancelled: boolean };
const EVERYONE: MentionCandidate = { id: 0, username: "todos", firstName: "Todo el", lastName: "equipo" };
/** @Tita: la asistente responde en la misma conversación con los datos de quien la menciona. */
const TITA: MentionCandidate = { id: -1, username: "Tita", firstName: "Tita", lastName: "(asistente)" };

/** Borradores por conversación mientras la app está abierta (cambiar de chat no borra lo escrito). */
const drafts = new Map<string, string>();

type Upload = { key: number; name: string; size: number; progress: number; done: ChatAttachment | null; failed: boolean };
let uploadSeq = 0;

type Props = {
  scopeKey: string;
  placeholder: string;
  label: string;
  candidates: MentionCandidate[];
  allowEveryone: boolean;
  replyTo: ChatMessage | null;
  /** La cita viene del canal general y esta conversación es privada. */
  privateReply: boolean;
  onCancelReply: () => void;
  onSend: (draft: ChatDraft) => void | Promise<void>;
  autoFocus?: boolean;
};

/**
 * Caja para escribir: Enter envía y Shift + Enter salta de línea; cita el mensaje al que se responde; adjunta archivos
 * (botón, pegar o arrastrar; se suben al elegirlos) y sugiere personas al escribir "@".
 */
export const Composer = ({ scopeKey, placeholder, label, candidates, allowEveryone, replyTo, privateReply, onCancelReply, onSend, autoFocus }: Props) => {
  const [text, setText] = useState(() => drafts.get(scopeKey) ?? "");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadChatAttachment();
  const recording = useRef<Recording | null>(null);
  const [recordingMs, setRecordingMs] = useState<number | null>(null);
  const [sendingVoice, setSendingVoice] = useState(false);

  useEffect(() => {
    drafts.set(scopeKey, text);
  }, [scopeKey, text]);
  useEffect(() => {
    if (replyTo || autoFocus) inputRef.current?.focus();
  }, [replyTo, autoFocus]);

  const options = mention
    ? [...(allowEveryone ? [EVERYONE] : []), TITA, ...candidates].filter((c) => normalize(`${c.username} ${c.firstName} ${c.lastName}`).includes(normalize(mention.query))).slice(0, 6)
    : [];

  const addFiles = (files: File[]) => {
    const room = MAX_FILES - uploads.length;
    for (const file of files.slice(0, Math.max(0, room))) {
      const key = ++uploadSeq;
      if (file.size > MAX_BYTES) {
        setUploads((u) => [...u, { key, name: file.name, size: file.size, progress: 0, done: null, failed: true }]);
        continue;
      }
      setUploads((u) => [...u, { key, name: file.name, size: file.size, progress: 0, done: null, failed: false }]);
      // mutateAsync y no mutate: con varias subidas a la vez, los callbacks de mutate solo corren para la última.
      upload
        .mutateAsync({ file, onProgress: (f) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, progress: f } : x))) })
        .then(
          (done) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, done, progress: 1 } : x))),
          () => setUploads((u) => u.map((x) => (x.key === key ? { ...x, failed: true } : x))),
        );
    }
  };

  /** Detiene la grabación; con `cancel`, descarta lo grabado. */
  const stopRecording = (cancel: boolean) => {
    const r = recording.current;
    if (!r) return;
    r.cancelled = cancel;
    if (r.recorder.state !== "inactive") r.recorder.stop();
    else r.stream.getTracks().forEach((t) => t.stop());
  };
  useEffect(() => () => stopRecording(true), []);
  const isRecording = recordingMs !== null;
  useEffect(() => {
    if (!isRecording) return;
    const t = window.setInterval(() => {
      const r = recording.current;
      if (!r) return;
      const ms = Date.now() - r.startedAt;
      setRecordingMs(ms);
      if (ms >= RECORD_MAX_MS) stopRecording(false);
    }, 250);
    return () => window.clearInterval(t);
  }, [isRecording]);

  /** Graba una nota de voz con el micrófono; al detener se sube con su duración y se envía como mensaje sin texto. */
  const startRecording = async () => {
    if (RECORD_MIME === null || recording.current) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      notify.error("No se pudo usar el micrófono. Revise el permiso del navegador.");
      return;
    }
    const recorder = new MediaRecorder(stream, { mimeType: RECORD_MIME });
    const r: Recording = { recorder, stream, chunks: [], startedAt: Date.now(), cancelled: false };
    recording.current = r;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) r.chunks.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      recording.current = null;
      setRecordingMs(null);
      const durationMs = Date.now() - r.startedAt;
      if (r.cancelled || r.chunks.length === 0 || durationMs < 500) return;
      const mime = RECORD_MIME.split(";")[0]!;
      const file = new File(r.chunks, `Nota de voz ${new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }).replace(/\s/g, "")}.${recordingExt(mime)}`, { type: mime });
      setSendingVoice(true);
      upload
        .mutateAsync({ file, durationMs })
        .then(async (done) => {
          await onSend({ body: "", replyTo, attachments: [done] });
          onCancelReply();
        })
        .catch(() => undefined)
        .finally(() => setSendingVoice(false));
    };
    recorder.start(250);
    setRecordingMs(0);
  };

  const uploading = uploads.some((u) => !u.done && !u.failed);
  const ready = uploads.filter((u) => u.done).map((u) => u.done!);
  const canSend = !uploading && (text.trim() !== "" || ready.length > 0);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    const draft: ChatDraft = { body: text.trim(), replyTo, attachments: ready };
    setText("");
    setUploads([]);
    setMention(null);
    drafts.delete(scopeKey);
    onCancelReply();
    await onSend(draft);
    inputRef.current?.focus();
  };

  const detectMention = (value: string, caret: number) => {
    const before = value.slice(0, caret);
    const m = /(^|[\s(¿¡,;:])@([a-z0-9._-]{0,50})$/i.exec(before);
    if (m) {
      setMention({ start: caret - m[2]!.length - 1, query: m[2]! });
      setActive(0);
    } else setMention(null);
  };

  const pick = (c: MentionCandidate) => {
    if (!mention) return;
    const el = inputRef.current;
    const caret = el?.selectionStart ?? text.length;
    const next = `${text.slice(0, mention.start)}@${c.username} ${text.slice(caret)}`;
    setText(next);
    setMention(null);
    const pos = mention.start + c.username.length + 2;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention && options.length > 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a + (e.key === "ArrowDown" ? 1 : options.length - 1)) % options.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pick(options[active] ?? options[0]!);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMention(null);
        return;
      }
    }
    if (e.key === "Escape" && replyTo) {
      onCancelReply();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = [...e.clipboardData.files];
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  };
  const onDrop = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles([...e.dataTransfer.files]);
  };

  return (
    <form
      className={[styles.composer, dragging ? styles.dragging : ""].join(" ")}
      onSubmit={submit}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {replyTo ? (
        <div className={styles.reply}>
          <div>
            <strong>
              {privateReply ? "Respuesta privada a" : "Respondiendo a"} {replyTo.firstName} {replyTo.lastName}
              {privateReply ? <em> · mensaje de #general (no se publica en el canal)</em> : null}
            </strong>
            <span>{bodyOrFiles(replyTo)}</span>
          </div>
          <button type="button" onClick={onCancelReply} aria-label="Quitar la cita" title="Quitar la cita (Esc)">
            ×
          </button>
        </div>
      ) : null}

      {uploads.length > 0 ? (
        <ul className={styles.uploads} aria-label="Adjuntos">
          {uploads.map((u) => (
            <li key={u.key} className={u.failed ? styles.uploadFailed : ""}>
              <span className={styles.uploadName} title={u.name}>
                {u.name}
              </span>
              <small>{u.failed ? (u.size > MAX_BYTES ? "Supera 10 MB" : "No se pudo subir") : u.done ? sizeLabel(u.size) : `Subiendo ${Math.round(u.progress * 100)} %`}</small>
              <button type="button" onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))} aria-label={`Quitar ${u.name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {recordingMs !== null ? (
        <div className={styles.recording} role="status" aria-live="polite">
          <span className={styles.recDot} aria-hidden="true" />
          <span className={styles.recTime}>Grabando nota de voz · {durationLabel(recordingMs)}</span>
          <button type="button" className={styles.recBtn} onClick={() => stopRecording(true)}>
            Cancelar
          </button>
          <button type="button" className={[styles.recBtn, styles.recStop].join(" ")} onClick={() => stopRecording(false)}>
            Detener
          </button>
        </div>
      ) : null}

      <div className={styles.row}>
        {RECORD_MIME !== null ? (
          <button
            type="button"
            className={[styles.attach, recordingMs !== null ? styles.micOn : ""].join(" ")}
            onClick={() => (recordingMs !== null ? stopRecording(false) : void startRecording())}
            disabled={sendingVoice}
            title={recordingMs !== null ? "Detener y enviar la nota de voz" : sendingVoice ? "Enviando la nota de voz…" : "Grabar una nota de voz"}
            aria-label={recordingMs !== null ? "Detener y enviar la nota de voz" : "Grabar una nota de voz"}
            aria-pressed={recordingMs !== null}
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <rect x="7" y="2.5" width="6" height="9.5" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5M7 17.5h6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
        <button type="button" className={styles.attach} onClick={() => fileRef.current?.click()} disabled={uploads.length >= MAX_FILES} title="Adjuntar archivos (fotos, notas de voz, PDF, Excel, Word, CSV o texto; hasta 10 MB)" aria-label="Adjuntar archivos">
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path d="M14.5 9.5 9 15a3.5 3.5 0 0 1-5-5l6-6a2.4 2.4 0 0 1 3.4 3.4l-6 6a1.2 1.2 0 0 1-1.7-1.7L11 6.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            addFiles([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
        <div className={styles.field}>
          <label htmlFor={`chat-input-${scopeKey}`} className="sr-only">
            {label}
          </label>
          <textarea
            id={`chat-input-${scopeKey}`}
            ref={inputRef}
            rows={1}
            maxLength={1000}
            placeholder={placeholder}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              detectMention(e.target.value, e.target.selectionStart);
            }}
            onClick={(e) => detectMention(e.currentTarget.value, e.currentTarget.selectionStart)}
            onKeyDown={onKey}
            onPaste={onPaste}
            onBlur={() => window.setTimeout(() => setMention(null), 150)}
            aria-autocomplete="list"
            aria-expanded={options.length > 0}
            aria-controls={options.length > 0 ? `chat-mentions-${scopeKey}` : undefined}
          />
          {options.length > 0 ? (
            <ul id={`chat-mentions-${scopeKey}`} className={styles.mentions} role="listbox" aria-label="Mencionar a">
              {options.map((c, i) => (
                <li key={c.id} role="option" aria-selected={i === active}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(c)} className={i === active ? styles.mentionOn : ""}>
                    <strong>@{c.username}</strong>
                    <span>
                      {c.firstName} {c.lastName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Button type="submit" disabled={!canSend}>
          Enviar
        </Button>
      </div>
      <p className={styles.hint}>Enter para enviar · Shift + Enter salto de línea · @ para mencionar · pegue o arrastre archivos{RECORD_MIME !== null ? " · micrófono para una nota de voz" : ""}</p>
    </form>
  );
};
