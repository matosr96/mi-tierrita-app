import { Button, EmptyState, QueryState } from "@/components/ui";
import { useAlarmFires, useAlarms } from "@/hooks/alarms";
import { dateTime } from "@/lib/format";
import { useNavigate } from "react-router-dom";
import type { Alarm } from "@/types/api";
import { AlarmItem } from "./AlarmItem";
import { AREA_LABELS, areaPath } from "./alarmLabels";
import styles from "./AlarmsScreen.module.css";

type Props = { tab: "upcoming" | "past"; onEdit: (alarm: Alarm) => void; onCreate: () => void };

/** Lista de la pestaña activa: alarmas programadas («Próximas») o disparos ocurridos («Pasadas»). */
export const AlarmList = ({ tab, onEdit, onCreate }: Props) => {
  const alarms = useAlarms({ limit: 100 }, { enabled: tab === "upcoming" });
  const fires = useAlarmFires({ limit: 50 }, { enabled: tab === "past" });
  const navigate = useNavigate();

  if (tab === "past") {
    return (
      <QueryState query={fires} isEmpty={(p) => p.items.length === 0} empty={<EmptyState title="Ninguna alarma ha sonado todavía" text="Cuando una alarma suene, quedará registrada aquí con su hora." />}>
        {(p) => (
          <ul className={styles.fires}>
            {p.items.map((f) => (
              <li key={f.id} className={styles.fire}>
                <div className={styles.fireBody}>
                  <span className={styles.fireTitle}>{f.title}</span>
                  {f.description ? <span className={styles.fireDesc}>{f.description}</span> : null}
                  <span className={styles.fireWhen}>
                    Sonó el {dateTime(f.firedAt)}
                    {f.area ? ` · ${AREA_LABELS[f.area]}` : ""}
                  </span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate(areaPath(f.area))}>
                  Ir al área
                </Button>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    );
  }

  return (
    <QueryState
      query={alarms}
      isEmpty={(p) => p.items.length === 0}
      empty={
        <EmptyState
          title="Todavía no tiene alarmas"
          text="Programe recordatorios como «Revisar lotes por vencer a las 7:30» o «Cierre de caja a las 5:30 p. m.»."
          action={<Button onClick={onCreate}>Nueva alarma</Button>}
        />
      }
    >
      {(p) => (
        <div className={styles.list}>
          {p.items.map((a) => (
            <AlarmItem key={a.id} alarm={a} onEdit={onEdit} />
          ))}
        </div>
      )}
    </QueryState>
  );
};
