import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { http } from "@/lib/http";
import { useAiStore } from "@/stores/ai";
import type { AiScreen } from "@/types/api";

/** Pausa al escribir antes de pedir la sugerencia, y largo mínimo del texto. */
export const AUTOCOMPLETE_DELAY_MS = 450;
export const AUTOCOMPLETE_MIN_CHARS = 8;

/**
 * Autocompletado al escribir (brief de octubre de 2026, punto 8): tras una pausa, un modelo rápido propone cómo
 * terminar la pregunta. Devuelve la continuación (sin lo ya escrito) para mostrarla como sugerencia; la persona la
 * acepta con Tab o tocándola. Cada petición cancela la anterior; sin red o con error, simplemente no sugiere.
 */
export const useTitaAutocomplete = (draft: string, screen: AiScreen | undefined, enabled = true) => {
  const [completion, setCompletion] = useState<{ prefix: string; text: string } | null>(null);
  const controller = useRef<AbortController | null>(null);
  const pending = useAiStore((s) => s.pending);

  useEffect(() => {
    controller.current?.abort();
    const text = draft;
    if (!enabled || pending || text.trim().length < AUTOCOMPLETE_MIN_CHARS || /[?!]\s*$/.test(text)) {
      setCompletion(null);
      return;
    }
    // La sugerencia anterior sigue valiendo mientras lo escrito la vaya siguiendo.
    setCompletion((prev) => (prev && text.startsWith(prev.prefix) && (prev.prefix + prev.text).startsWith(text) ? { prefix: text, text: (prev.prefix + prev.text).slice(text.length) } : null));
    const ctl = new AbortController();
    controller.current = ctl;
    const timer = window.setTimeout(() => {
      void http
        .post<{ completion: string }>("/ai/complete", { text, ...(screen ? { screen } : {}) }, { signal: ctl.signal, timeout: 8_000 })
        .then((res) => {
          if (ctl.signal.aborted) return;
          const c = res.data.completion;
          setCompletion(c ? { prefix: text, text: c } : null);
        })
        .catch((err: unknown) => {
          if (axios.isCancel(err)) return;
          setCompletion(null);
        });
    }, AUTOCOMPLETE_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      ctl.abort();
    };
  }, [draft, screen, enabled, pending]);

  const suggestion = completion && draft === completion.prefix ? completion.text : null;
  return { suggestion, accept: () => (suggestion ? draft + suggestion : draft), clear: () => setCompletion(null) };
};
