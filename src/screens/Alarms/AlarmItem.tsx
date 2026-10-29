import { useState } from "react";
import { Badge, Button, Modal, Switch } from "@/components/ui";
import { useDeleteAlarm, useDownloadAlarmIcs, useSetAlarmActive } from "@/hooks/alarms";
import { dateTime } from "@/lib/format";
import type { Alarm } from "@/types/api";
import { AREA_LABELS, repeatText, timeText } from "./alarmLabels";
import styles from "./AlarmsScreen.module.css";

type Props = { alarm: Alarm; onEdit: (alarm: Alarm) => void };

/** Una alarma de la lista: hora grande, repetición, área, interruptor y acciones (editar, .ics, eliminar con confirmación). */
export const AlarmItem = ({ alarm, onEdit }: Props) => {
  const setActive = useSetAlarmActive();
  const remove = useDeleteAlarm();
  const ics = useDownloadAlarmIcs();
  const [confirm, setConfirm] = useState(false);

  return (
    <article className={[styles.item, alarm.active ? "" : styles.itemOff].join(" ")}>
      <div className={styles.time}>
        <span className={styles.timeBig}>{timeText(alarm.timeOfDay)}</span>
        <span className={styles.repeat}>{repeatText(alarm)}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{alarm.title}</h3>
        {alarm.description ? <p className={styles.desc}>{alarm.description}</p> : null}
        <div className={styles.meta}>
          <Badge tone={alarm.active ? "good" : "neutral"}>{alarm.active ? "Activa" : "Apagada"}</Badge>
          {alarm.area ? <Badge tone="neutral">{AREA_LABELS[alarm.area]}</Badge> : null}
          {alarm.active && alarm.nextFireAt ? <span className={styles.next}>Próxima: {dateTime(alarm.nextFireAt)}</span> : null}
          {!alarm.active && alarm.lastFiredAt ? <span className={styles.next}>Última: {dateTime(alarm.lastFiredAt)}</span> : null}
        </div>
      </div>
      <div className={styles.controls}>
        <Switch
          id={`alarm-${alarm.id}-active`}
          checked={alarm.active}
          busy={setActive.isPending}
          onChange={(active) => setActive.mutate({ id: alarm.id, active })}
          label={<span className={styles.srOnly}>{alarm.active ? "Apagar" : "Activar"} la alarma {alarm.title}</span>}
        />
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => onEdit(alarm)}>
            Editar
          </Button>
          <Button size="sm" variant="ghost" loading={ics.isPending} onClick={() => ics.mutate(alarm.id)}>
            Agregar al calendario (.ics)
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirm(true)}>
            Eliminar
          </Button>
        </div>
      </div>
      {confirm ? (
        <Modal
          open
          title="Eliminar alarma"
          description={`«${alarm.title}» dejará de sonar y se borrará su historial.`}
          onClose={() => setConfirm(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirm(false)} disabled={remove.isPending}>
                Cancelar
              </Button>
              <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutateAsync(alarm.id).then(() => setConfirm(false), () => undefined)}>
                Eliminar
              </Button>
            </>
          }
        >
          <p className={styles.confirmText}>Esta acción no se puede deshacer.</p>
        </Modal>
      ) : null}
    </article>
  );
};
