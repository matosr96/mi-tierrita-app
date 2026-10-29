import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { keys, useApiMutation } from "@/hooks/shared";
import { pushService } from "@/services/push";

/** Clave pública VAPID (base64url) al formato que pide `pushManager.subscribe`. */
const toApplicationServerKey = (base64url: string): Uint8Array<ArrayBuffer> => {
  const padded = `${base64url}${"=".repeat((4 - (base64url.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

const isSupported = (): boolean => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const registerWorker = async (): Promise<ServiceWorkerRegistration> => {
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  return reg;
};

/**
 * Avisos en este dispositivo aunque la pestaña esté cerrada (Web Push, brief 2026, punto 14). `supported` dice si el
 * navegador puede; `available` si el servidor tiene par VAPID; `enabled` si este navegador ya está suscrito.
 * `subscribe` pide permiso, registra el service worker (`/sw.js`) y guarda la suscripción en la API; `unsubscribe`
 * la da de baja en ambos lados.
 */
export const usePushSubscription = () => {
  const supported = isSupported();
  const publicKey = useQuery({ queryKey: [...keys.push, "public-key"], queryFn: pushService.publicKey, staleTime: Infinity, enabled: supported });
  const available = publicKey.data?.enabled ?? false;
  const [enabled, setEnabled] = useState<boolean | null>(supported ? null : false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => (isSupported() ? Notification.permission : "unsupported"));

  useEffect(() => {
    if (!supported) return;
    let alive = true;
    navigator.serviceWorker
      .getRegistration("/")
      .then((reg) => reg?.pushManager.getSubscription() ?? null)
      .then((sub) => {
        if (alive) setEnabled(sub !== null);
      })
      .catch(() => {
        if (alive) setEnabled(false);
      });
    return () => {
      alive = false;
    };
  }, [supported]);

  const subscribeMutation = useApiMutation(
    async () => {
      const key = publicKey.data?.publicKey;
      if (!key) throw new Error("El servidor no tiene configurados los avisos push.");
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") throw new Error("Sin permiso del navegador no se pueden mostrar avisos.");
      const reg = await registerWorker();
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toApplicationServerKey(key) }));
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.["p256dh"] || !json.keys?.["auth"]) throw new Error("El navegador no entregó una suscripción válida.");
      await pushService.subscribe({ endpoint: json.endpoint, keys: { p256dh: json.keys["p256dh"], auth: json.keys["auth"] }, userAgent: navigator.userAgent.slice(0, 200) });
      setEnabled(true);
    },
    { success: "Avisos activados en este dispositivo." },
  );

  const unsubscribeMutation = useApiMutation(
    async () => {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = (await reg?.pushManager.getSubscription()) ?? null;
      if (sub) {
        // Si la API ya no la tenía (674), igual se da de baja en el navegador.
        await pushService.unsubscribe(sub.endpoint).catch(() => undefined);
        await sub.unsubscribe();
      }
      setEnabled(false);
    },
    { success: "Avisos desactivados en este dispositivo." },
  );

  const subscribe = useCallback(() => subscribeMutation.mutate(undefined), [subscribeMutation]);
  const unsubscribe = useCallback(() => unsubscribeMutation.mutate(undefined), [unsubscribeMutation]);

  return {
    supported,
    available,
    /** null mientras se consulta el navegador. */
    enabled,
    permission,
    busy: subscribeMutation.isPending || unsubscribeMutation.isPending || (supported && publicKey.isPending),
    subscribe,
    unsubscribe,
  };
};
