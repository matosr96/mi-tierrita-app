import { Switch } from "@/components/ui";
import { usePushSubscription } from "@/hooks/push";

/**
 * Interruptor «Avisos en este dispositivo»: suscribe o da de baja este navegador a Web Push. Si el navegador no lo
 * soporta o el servidor no tiene par VAPID, lo dice en vez de ofrecer un control que no haría nada.
 */
export const PushSwitch = ({ id = "push-switch" }: { id?: string }) => {
  const push = usePushSubscription();
  const hint = !push.supported
    ? "Este navegador no permite avisos con la pestaña cerrada."
    : !push.available
      ? "El servidor no tiene configurados los avisos push (par VAPID)."
      : push.permission === "denied"
        ? "El navegador tiene bloqueadas las notificaciones para este sitio; actívelas en su configuración."
        : "Las alarmas y los avisos de vencimiento llegan como notificación del sistema, incluso con la pestaña cerrada.";
  const canToggle = push.supported && push.available && push.permission !== "denied";
  return (
    <Switch
      id={id}
      checked={push.enabled === true}
      onChange={(next) => (next ? push.subscribe() : push.unsubscribe())}
      disabled={!canToggle}
      busy={push.busy || push.enabled === null}
      label="Avisos en este dispositivo (aunque la pestaña esté cerrada)"
      hint={hint}
    />
  );
};
