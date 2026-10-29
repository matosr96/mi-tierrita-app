import { useEffect, useState } from "react";
import { useChatAttachment } from "@/hooks/chat";
import type { ChatAttachment } from "@/types/api";
import styles from "./MediaThumb.module.css";

/** Miniatura de una foto de la conversación (descargada con la sesión); al tocarla se va al mensaje. */
export const MediaThumb = ({ file, caption, onOpen }: { file: ChatAttachment; caption: string; onOpen: () => void }) => {
  const blob = useChatAttachment(file.id);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob.data) return;
    const u = URL.createObjectURL(blob.data);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob.data]);
  return (
    <button type="button" className={styles.thumb} onClick={onOpen} title={`${file.name} · ${caption} · ir al mensaje`} aria-label={`Foto ${file.name}, ${caption}. Ir al mensaje`}>
      {url ? <img src={url} alt="" loading="lazy" /> : <span className={styles.placeholder}>{blob.isError ? "Sin vista" : "…"}</span>}
    </button>
  );
};
