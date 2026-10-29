import { dayHeading, todayIso } from "@/lib/format";
import type { CalendarItem } from "@/types/api";
import { CalendarItemRow } from "./CalendarItemRow";
import { groupByDay } from "./calendarGroups";
import styles from "./Calendar.module.css";

/** Agenda: los ítems agrupados por día, en orden de fecha. */
export const CalendarAgenda = ({ items }: { items: CalendarItem[] }) => {
  const today = todayIso();
  return (
    <div className={styles.agenda}>
      {groupByDay(items).map((group) => (
        <section key={group.date} className={styles.agendaDay} aria-label={dayHeading(group.date)}>
          <h3 className={styles.agendaHead}>
            {dayHeading(group.date)}
            {group.date === today ? <span className={styles.todayTag}>Hoy</span> : null}
          </h3>
          <ul className={styles.list}>
            {group.items.map((item) => (
              <CalendarItemRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
