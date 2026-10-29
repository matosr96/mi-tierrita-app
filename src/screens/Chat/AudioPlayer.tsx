import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useChatAttachment, usePlayChatMessage } from "@/hooks/chat";
import type { ChatAttachment } from "@/types/api";
import { durationLabel } from "./chatFormat";
import styles from "./AudioPlayer.module.css";

const PLAYED_AT = 0.9;

/**
 * Reproductor de una nota de voz dentro del mensaje: píldora con reproducir/pausar, barra de progreso (deslizador
 * accesible: clic o flechas para adelantar) y duración "m:ss". El audio se descarga con la sesión al primer toque.
 * Al terminar (o al pasar el 90 %) avisa a la API que se reprodujo, solo si el mensaje es de otra persona.
 */
export const AudioPlayer = ({ file, messageId, mine }: { file: ChatAttachment; messageId: number; mine: boolean }) => {
  const [wanted, setWanted] = useState(false);
  const blob = useChatAttachment(file.id, { enabled: wanted && file.id > 0 });
  const played = usePlayChatMessage();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState<number | null>(file.durationMs !== null ? file.durationMs / 1000 : null);
  const reported = useRef(false);

  useEffect(() => {
    if (!blob.data) return;
    const u = URL.createObjectURL(blob.data);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob.data]);

  // Con la descarga lista, arranca lo que la persona ya pidió.
  useEffect(() => {
    if (url && wanted) void audioRef.current?.play().catch(() => setPlaying(false));
  }, [url, wanted]);

  const report = () => {
    if (mine || reported.current || messageId <= 0) return;
    reported.current = true;
    played.mutate(messageId);
  };

  const toggle = () => {
    if (!url) {
      setWanted(true);
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => setPlaying(false));
    else el.pause();
  };

  const seekTo = (fraction: number) => {
    const el = audioRef.current;
    if (!el || length === null) return;
    el.currentTime = Math.max(0, Math.min(length, fraction * length));
    setTime(el.currentTime);
  };
  const onBarClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0) seekTo((e.clientX - rect.left) / rect.width);
  };
  const onBarKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (length === null) return;
    const step = Math.max(1, length / 20);
    const moves: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, Home: -length, End: length };
    const delta = moves[e.key];
    if (delta === undefined) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggle();
      }
      return;
    }
    e.preventDefault();
    seekTo((time + delta) / length);
  };

  const fraction = length ? Math.min(1, time / length) : 0;
  const loading = wanted && !url && !blob.isError;
  const label = playing ? "Pausar la nota de voz" : "Reproducir la nota de voz";

  return (
    <span className={styles.player} data-audio-player>
      <audio
        ref={audioRef}
        src={url ?? undefined}
        preload="metadata"
        hidden
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setLength(d);
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setLength(d);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setTime(t);
          if (length !== null && t / length >= PLAYED_AT) report();
        }}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
          report();
        }}
      />
      <button type="button" className={styles.play} onClick={toggle} aria-label={label} title={label} disabled={blob.isError || file.id <= 0}>
        {loading ? (
          <span className={styles.spinner} aria-hidden="true" data-motion />
        ) : playing ? (
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M5 3h2.2v10H5zM8.8 3H11v10H8.8z" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M5 3.2v9.6L12.5 8z" fill="currentColor" />
          </svg>
        )}
      </button>
      <div
        className={styles.bar}
        role="slider"
        tabIndex={0}
        aria-label="Avance de la nota de voz"
        aria-valuemin={0}
        aria-valuemax={length !== null ? Math.round(length) : 0}
        aria-valuenow={Math.round(time)}
        aria-valuetext={`${durationLabel(time * 1000)} de ${durationLabel(length !== null ? length * 1000 : null)}`}
        onClick={onBarClick}
        onKeyDown={onBarKey}
      >
        <span className={styles.fill} style={{ width: `${fraction * 100}%` }} />
        <span className={styles.knob} style={{ left: `${fraction * 100}%` }} />
      </div>
      <span className={styles.time} aria-hidden="true">
        {blob.isError ? "No se pudo cargar" : durationLabel(playing || time > 0 ? time * 1000 : length !== null ? length * 1000 : null)}
      </span>
    </span>
  );
};
