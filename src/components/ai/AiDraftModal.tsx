import { useEffect, useRef, useState } from "react";
import { Button, Callout, Loading, Modal } from "@/components/ui";
import { useAiDraft } from "@/hooks/ai";
import { notify } from "@/stores/toasts";
import type { AiDraft, AiDraftRequest } from "@/types/api";
import styles from "./AiDraftModal.module.css";

type Props = { open: boolean; onClose: () => void; title: string; request: AiDraftRequest; description?: string };

/** Enlace de WhatsApp con el borrador; antepone el indicativo de Colombia si el número no lo trae. */
const whatsappUrl = (phone: string, text: string): string => {
  const digits = phone.replace(/\D/g, "");
  const full = digits.startsWith("57") && digits.length >= 12 ? digits : `57${digits}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
};

/** Borrador redactado por la IA con datos reales: se pide una vez al abrir, se revisa, se edita y se copia o se abre en WhatsApp. */
export const AiDraftModal = ({ open, onClose, title, request, description }: Props) => {
  const draft = useAiDraft();
  const [result, setResult] = useState<AiDraft | null>(null);
  const [text, setText] = useState("");
  const requested = useRef(false);
  const requestRef = useRef(request);
  requestRef.current = request;
  const { mutate, reset } = draft;

  const run = () => {
    setResult(null);
    mutate(requestRef.current, {
      onSuccess: (d) => {
        setResult(d);
        setText(d.text);
      },
    });
  };
  const runRef = useRef(run);
  runRef.current = run;

  // Una sola petición por apertura (el guardián evita la doble llamada del modo estricto).
  useEffect(() => {
    if (!open) {
      requested.current = false;
      setResult(null);
      setText("");
      reset();
      return;
    }
    if (requested.current) return;
    requested.current = true;
    runRef.current();
  }, [open, reset]);

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("clipboard");
      await navigator.clipboard.writeText(text);
      notify.success("Borrador copiado.");
    } catch {
      notify.error("No se pudo copiar. Seleccione el texto y cópielo a mano.");
    }
  };

  const ready = !draft.isPending ? result : null;

  return (
    <Modal
      open={open}
      title={title}
      {...(description !== undefined ? { description } : {})}
      onClose={onClose}
      footer={
        ready ? (
          <>
            <Button variant="ghost" onClick={run}>
              Volver a redactar
            </Button>
            <Button variant="secondary" onClick={copy} disabled={text.trim() === ""}>
              Copiar
            </Button>
            {ready.phone ? (
              <a className={styles.whatsapp} href={whatsappUrl(ready.phone, text)} target="_blank" rel="noopener noreferrer">
                Abrir en WhatsApp
              </a>
            ) : null}
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        )
      }
    >
      <div className={styles.body}>
        {draft.isError ? (
          <Callout tone="bad" title="No se pudo redactar el borrador">
            <span>{draft.error.message}</span>
            <div className={styles.retry}>
              <Button variant="secondary" size="sm" onClick={run}>
                Intentar de nuevo
              </Button>
            </div>
          </Callout>
        ) : ready === null ? (
          <Loading inline text="Redactando con datos reales…" />
        ) : (
          <div className={styles.editor}>
            <label className={styles.label} htmlFor="ai-draft-text">
              Borrador — revíselo antes de enviarlo
            </label>
            <textarea id="ai-draft-text" className={styles.textarea} value={text} onChange={(e) => setText(e.target.value)} rows={9} />
          </div>
        )}
        <p className={styles.note}>
          Redactado por Tita con los datos del sistema. Nada se envía solo.
        </p>
      </div>
    </Modal>
  );
};
