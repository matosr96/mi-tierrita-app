import { Badge, Button, sizeLabel, viewerKind } from "@/components/ui";
import { dateTime } from "@/lib/format";
import { ROLE_LABELS } from "@/stores/session";
import type { LibraryItem } from "@/types/api";
import styles from "./LibraryScreen.module.css";

type Props = { item: LibraryItem; canManage: boolean; onView: (item: LibraryItem) => void; onEdit: (item: LibraryItem) => void; onDelete: (item: LibraryItem) => void };

type IconKind = "link" | "image" | "pdf" | "sheet" | "doc" | "text";

const ICON_PATHS: Record<IconKind, string> = {
  link: "M8.5 11.5 11.5 8.5M7 13l-1 1a2.5 2.5 0 0 1-3.5-3.5l2-2A2.5 2.5 0 0 1 8 8.5M13 7l1-1a2.5 2.5 0 0 0-3.5-3.5l-2 2A2.5 2.5 0 0 0 12 11.5",
  image: "M3 4.5h14v11H3zM6 12l3-3 3 3 2-2 3 3M7 8.2a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6z",
  pdf: "M5 2.5h7l3.5 3.5v11.5H5zM12 2.5V6h3.5M7.5 13.5v-4h1.6a1.2 1.2 0 0 1 0 2.4H7.5M11.5 13.5v-4h1.3a1.4 1.4 0 0 1 0 4z",
  sheet: "M4 3.5h12v13H4zM4 8h12M4 12h12M9 3.5v13",
  doc: "M5 2.5h7l3.5 3.5v11.5H5zM12 2.5V6h3.5M7.5 10h5M7.5 13h5",
  text: "M4 4.5h12M4 8h12M4 11.5h12M4 15h7",
};

const LABELS: Record<IconKind, string> = { link: "Enlace", image: "Imagen", pdf: "PDF", sheet: "Excel", doc: "Word", text: "Texto" };

export const iconKindOf = (item: LibraryItem): IconKind => {
  if (item.kind === "link") return "link";
  const mime = item.mime ?? "";
  const kind = viewerKind(mime, item.name ?? "");
  if (kind === "image") return "image";
  if (kind === "pdf") return "pdf";
  if (kind === "csv" || mime.includes("spreadsheet") || mime === "application/vnd.ms-excel") return "sheet";
  if (mime.includes("word") || mime === "application/msword") return "doc";
  return "text";
};

/** Dominio legible de un enlace (sin "www."). */
const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** Tarjeta de un documento o enlace: ícono por tipo, título, descripción, quién lo puso y cuándo; acciones según el rol. */
export const LibraryItemCard = ({ item, canManage, onView, onEdit, onDelete }: Props) => {
  const icon = iconKindOf(item);
  return (
    <li className={styles.card}>
      <div className={styles.cardTop}>
        <span className={[styles.icon, styles[`icon_${icon}`]].join(" ")} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <path d={ICON_PATHS[icon]} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className={styles.cardText}>
          <h3 className={styles.cardTitle}>{item.title}</h3>
          <span className={styles.cardSub}>
            {LABELS[icon]}
            {item.kind === "link" && item.url ? ` · ${hostOf(item.url)}` : null}
            {item.kind === "document" && item.size ? ` · ${sizeLabel(item.size)}` : null}
          </span>
        </div>
      </div>
      {item.description ? <p className={styles.cardDesc}>{item.description}</p> : null}
      <div className={styles.cardMeta}>
        <span>
          {item.createdBy.name} · {dateTime(item.createdAt)}
        </span>
        {item.roles.length > 0 ? (
          <span className={styles.roles}>
            {item.roles.map((r) => (
              <Badge key={r} tone="neutral">
                {ROLE_LABELS[r]}
              </Badge>
            ))}
          </span>
        ) : null}
      </div>
      <div className={styles.cardActions}>
        {item.kind === "link" && item.url ? (
          <a className={styles.linkBtn} href={item.url} target="_blank" rel="noopener noreferrer">
            Abrir enlace
          </a>
        ) : (
          <Button size="sm" variant="primary" onClick={() => onView(item)}>
            Ver
          </Button>
        )}
        {canManage ? (
          <>
            <Button size="sm" variant="secondary" onClick={() => onEdit(item)}>
              Editar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(item)}>
              Eliminar
            </Button>
          </>
        ) : null}
      </div>
    </li>
  );
};
