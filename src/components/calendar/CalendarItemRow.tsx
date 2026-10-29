import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui";
import type { CalendarItem, CalendarStatus } from "@/types/api";
import { PRIORITY_LABEL, STATUS_LABEL, toneOf } from "./calendarGroups";
import styles from "./Calendar.module.css";

const STATUS_TONE: Record<CalendarStatus, "neutral" | "bad" | "good"> = { pending: "neutral", overdue: "bad", done: "good" };
const TONE_CLASS = { bad: styles.toneBad, done: styles.toneDone, warn: styles.toneWarn, pending: styles.tonePending };

/** Un ítem del calendario como botón: al tocarlo lleva a su pantalla (`href`). */
export const CalendarItemRow = ({ item }: { item: CalendarItem }) => {
  const navigate = useNavigate();
  return (
    <li>
      <button type="button" className={[styles.item, TONE_CLASS[toneOf(item)]].join(" ")} onClick={() => navigate(item.href)}>
        <span className={styles.itemBar} aria-hidden="true" />
        <span className={styles.itemBody}>
          <span className={styles.itemTitle}>{item.title}</span>
          <span className={styles.itemDetail}>{item.detail}</span>
          <span className={styles.itemMeta}>
            {item.area} · {PRIORITY_LABEL[item.priority]}
          </span>
        </span>
        <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
      </button>
    </li>
  );
};
