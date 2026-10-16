import { useEffect, useRef, useState } from "react";
import { chatService } from "@/services/chat";
import type { ChatMessage } from "@/types/api";

const POLL_MS = 4000;

/**
 * Mensajes del chat del equipo: carga los últimos y luego pide cada 4 s solo los nuevos (`after`), mientras la pestaña
 * está visible. `push` agrega de inmediato el mensaje propio recién enviado.
 */
export const useChatMessages = (enabled = true) => {
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"pending" | "ready" | "error">("pending");
  const lastId = useRef<number | undefined>(undefined);

  const merge = (incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setItems((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const next = [...prev, ...incoming.filter((m) => !seen.has(m.id))].sort((a, b) => a.id - b.id);
      lastId.current = next.at(-1)?.id;
      return next;
    });
  };

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: number | undefined;
    let first = true;
    const tick = async () => {
      try {
        // La primera carga va siempre; las siguientes, solo con la pestaña a la vista.
        if (first || document.visibilityState === "visible") {
          first = false;
          const page = await chatService.list(lastId.current === undefined ? { limit: 60 } : { after: lastId.current, limit: 100 });
          if (cancelled) return;
          merge(page.items);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus((s) => (s === "pending" ? "error" : s));
      }
      if (!cancelled) timer = window.setTimeout(tick, POLL_MS);
    };
    void tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled]);

  return { items, status, push: (m: ChatMessage) => merge([m]) };
};
