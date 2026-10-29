import { useState } from "react";
import { PageHeader } from "@/components/layout/AppShell";
import { PushSwitch } from "@/components/push/PushSwitch";
import { Button, Card, Tabs, type TabOption } from "@/components/ui";
import { useAlarms, useDownloadAlarmIcs } from "@/hooks/alarms";
import type { Alarm } from "@/types/api";
import { AlarmFormModal } from "./AlarmFormModal";
import { AlarmList } from "./AlarmList";
import styles from "./AlarmsScreen.module.css";

type Tab = "upcoming" | "past";
const TABS: TabOption<Tab>[] = [
  { value: "upcoming", label: "Próximas" },
  { value: "past", label: "Pasadas" },
];

/** Alarmas personalizadas (brief 2026, punto 12): cualquier rol programa las suyas; suenan en pantalla y por push. */
export const AlarmsScreen = () => {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [form, setForm] = useState<{ open: false } | { open: true; alarm: Alarm | null }>({ open: false });
  const alarms = useAlarms({ limit: 100 });
  const activeCount = alarms.data?.items.filter((a) => a.active).length ?? 0;
  const downloadAll = useDownloadAlarmIcs();

  return (
    <>
      <PageHeader
        title="Alarmas"
        subtitle="Recordatorios a la hora que usted elija: suenan en pantalla y, si lo activa, en este dispositivo aunque la pestaña esté cerrada."
        actions={
          <div className={styles.headerActions}>
            {activeCount > 0 ? (
              <Button variant="secondary" loading={downloadAll.isPending} onClick={() => downloadAll.mutate("all")}>
                Descargar todas (.ics)
              </Button>
            ) : null}
            <Button onClick={() => setForm({ open: true, alarm: null })}>Nueva alarma</Button>
          </div>
        }
      />

      <div className={styles.page}>
        <Card soft>
          <PushSwitch id="alarms-push-switch" />
        </Card>

        <div className={styles.bar}>
          <Tabs options={TABS} value={tab} onChange={setTab} ariaLabel="Alarmas próximas o pasadas" />
        </div>

        <AlarmList tab={tab} onEdit={(alarm) => setForm({ open: true, alarm })} onCreate={() => setForm({ open: true, alarm: null })} />

        {form.open ? <AlarmFormModal alarm={form.alarm} onClose={() => setForm({ open: false })} /> : null}
      </div>
    </>
  );
};
