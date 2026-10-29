/*
 * Service worker de Mi Tierrita SIG: solo Web Push (brief 2026, punto 14). No guarda caché ni intercepta peticiones.
 * `push` muestra la notificación con el título, el texto y la pantalla (`href`) que manda la API;
 * `notificationclick` enfoca una pestaña de la app (o abre una) en esa pantalla.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = { title: "Mi Tierrita", body: "", href: "/", tag: undefined };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    data.body = event.data ? event.data.text() : "";
  }
  const options = { body: data.body, icon: "/favicon.svg", badge: "/favicon.svg", data: { href: data.href || "/" }, tag: data.tag, renotify: Boolean(data.tag) };
  event.waitUntil(self.registration.showNotification(data.title || "Mi Tierrita", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/";
  const target = new URL(href, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const own = list.find((c) => c.url.startsWith(self.location.origin));
      if (own) {
        return own.focus().then((c) => (c && "navigate" in c ? c.navigate(target) : c));
      }
      return self.clients.openWindow(target);
    }),
  );
});
