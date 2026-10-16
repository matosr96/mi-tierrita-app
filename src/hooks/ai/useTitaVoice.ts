import { useCallback, useEffect, useRef, useState } from "react";

/* Tipos mínimos de la Web Speech API (no vienen en lib.dom de TypeScript). */
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

const getRecognition = (): RecognitionCtor | null => {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** Texto del modelo sin marcas de formato, para leerlo en voz alta. */
const forSpeech = (text: string) =>
  text
    .replace(/\*\*/g, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/\$\s?([\d.]+)/g, "$1 pesos")
    .replace(/\s+/g, " ")
    .trim();

/** Una voz en español, preferiblemente latinoamericana. */
const spanishVoice = (): SpeechSynthesisVoice | undefined => {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const order = ["es-CO", "es-419", "es-MX", "es-US", "es-ES"];
  for (const lang of order) {
    const v = voices.find((x) => x.lang.replace("_", "-") === lang);
    if (v) return v;
  }
  return voices.find((x) => x.lang.toLowerCase().startsWith("es"));
};

export type VoiceState = "off" | "listening" | "thinking" | "speaking";

/**
 * Conversación por voz con Tita usando el reconocimiento y la síntesis de voz del navegador (sin servicios extra).
 * En modo en vivo: escucha → al terminar la frase envía (`onAsk`) → lee la respuesta → vuelve a escuchar.
 * `supported` es false en navegadores sin reconocimiento de voz (por ejemplo, Firefox): la app oculta el botón.
 */
export const useTitaVoice = (onAsk: (text: string) => Promise<string | null>) => {
  const Ctor = typeof window !== "undefined" ? getRecognition() : null;
  const supported = Ctor !== null && "speechSynthesis" in window;
  const [state, setState] = useState<VoiceState>("off");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const live = useRef(false);
  const rec = useRef<Recognition | null>(null);
  const askRef = useRef(onAsk);
  askRef.current = onAsk;

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(forSpeech(text));
      u.lang = "es-CO";
      const voice = spanishVoice();
      if (voice) u.voice = voice;
      u.rate = 1.03;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }, []);

  const listen = useCallback(() => {
    if (!Ctor || !live.current) return;
    const r = new Ctor();
    rec.current = r;
    r.lang = "es-CO";
    r.interimResults = true;
    r.continuous = false;
    let finalText = "";
    r.onresult = (e) => {
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (!res) continue;
        if (res.isFinal) finalText += res[0].transcript;
        else partial += res[0].transcript;
      }
      setInterim((finalText + " " + partial).trim());
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("El navegador no dio permiso para usar el micrófono.");
        live.current = false;
        setState("off");
      }
    };
    r.onend = () => {
      rec.current = null;
      const text = finalText.trim();
      setInterim("");
      if (!live.current) return;
      if (text === "") {
        // Silencio: sigue escuchando mientras el modo en vivo esté activo.
        listen();
        return;
      }
      setState("thinking");
      void askRef.current(text).then(async (reply) => {
        if (!live.current) return;
        if (reply) {
          setState("speaking");
          await speak(reply);
        }
        if (live.current) {
          setState("listening");
          listen();
        }
      });
    };
    setState("listening");
    try {
      r.start();
    } catch {
      /* ya estaba escuchando */
    }
  }, [Ctor, speak]);

  const start = useCallback(() => {
    if (!supported) return;
    setError(null);
    live.current = true;
    // Algunos navegadores cargan las voces en diferido.
    window.speechSynthesis.getVoices();
    listen();
  }, [supported, listen]);

  const stop = useCallback(() => {
    live.current = false;
    rec.current?.abort();
    rec.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setInterim("");
    setState("off");
  }, []);

  useEffect(() => stop, [stop]);

  return { supported, state, interim, error, start, stop, speak };
};
