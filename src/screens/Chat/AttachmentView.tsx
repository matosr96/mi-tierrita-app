import { useEffect, useState } from "react";
import { useChatAttachment, useDownloadChatAttachment } from "@/hooks/chat";
import type { ChatAttachment } from "@/types/api";
import { isImage, sizeLabel } from "./chatFormat";
import styles from "./AttachmentView.module.css";

const FileIcon = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
    <path d="M5 2.5h6.5L15 6v11.5H5z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M11.5 2.5V6H15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

/** Vista previa de una foto (descargada con la sesión) o ficha del archivo con su botón de descarga. */
export const AttachmentView = ({ file }: { file: ChatAttachment }) => {
  const image = isImage(file.mime);
  const blob = useChatAttachment(file.id, { enabled: image && file.id > 0 });
  const download = useDownloadChatAttachment();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob.data) return;
    const u = URL.createObjectURL(blob.data);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob.data]);

  if (image) {
    return (
      <button type="button" className={styles.photo} onClick={() => download.mutate({ file, open: true })} title={`Abrir ${file.name}`} aria-label={`Abrir la foto ${file.name}`}>
        {url ? <img src={url} alt={file.name} loading="lazy" /> : <span className={styles.placeholder}>{blob.isError ? "No se pudo cargar la foto" : "Cargando foto…"}</span>}
      </button>
    );
  }
  return (
    <span className={styles.file}>
      <FileIcon />
      <span className={styles.fileText}>
        <strong title={file.name}>{file.name}</strong>
        <small>{sizeLabel(file.size)}</small>
      </span>
      {file.mime === "application/pdf" ? (
        <button type="button" className={styles.fileBtn} onClick={() => download.mutate({ file, open: true })} disabled={file.id <= 0}>
          Abrir
        </button>
      ) : null}
      <button type="button" className={styles.fileBtn} onClick={() => download.mutate({ file })} disabled={file.id <= 0 || download.isPending}>
        Descargar
      </button>
    </span>
  );
};
