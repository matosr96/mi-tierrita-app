import { useEffect, useState } from "react";
import { TitaAvatar } from "@/components/ai/TitaAvatar";
import { Reveal, SplitText, useInView } from "./motion";
import styles from "./LandingTita.module.css";
import base from "./Landing.module.css";

/** Una escena de la conversación ilustrativa (cifras de ejemplo). */
type Scene = {
  who: string;
  voice?: boolean;
  file?: string;
  ask: string;
  reply: string;
  card: { title: string; lines: string[]; confirm: string };
};

const SCENES: Scene[] = [
  {
    who: "Bodega",
    ask: "¿Qué debo reponer esta semana?",
    reply: "Primero el concentrado lechero: quedan 6 bultos y se venden 2 al día. Para un mes, 54 bultos.",
    card: { title: "Compra a Distribuidora del Caribe", lines: ["54 × Concentrado lechero 40 kg", "Vence 30/01/2027"], confirm: "Registrar compra" },
  },
  {
    who: "Caja",
    file: "pedido-finca.jpg",
    ask: "Prepare la venta de este pedido",
    reply: "Listo: 3 bultos de concentrado y una vacuna aftosa para Carlos Díaz, a crédito. Le alcanza el cupo.",
    card: { title: "Venta a crédito", lines: ["3 × Concentrado lechero · 1 × Vacuna aftosa", "Total estimado $ 386.000"], confirm: "Registrar venta" },
  },
  {
    who: "Administración",
    voice: true,
    ask: "¿Cómo vamos hoy?",
    reply: "Van 18 ventas por $ 1.240.000; $ 310.000 a crédito. Doña Rosa ya abonó lo de la semana pasada.",
    card: { title: "Reporte de ventas de hoy", lines: ["Por producto · listo para PDF o Excel"], confirm: "Abrir reporte" },
  },
];

/** Pasos de cada escena: pregunta → Tita piensa → respuesta → tarjeta → confirmado. */
const STEPS = 5;
const STEP_MS = 1150;
const HOLD_MS = 2600;

const POINTS = [
  { verb: "Pregúntele", text: "por ventas, existencias, lotes por vencer o lo que debe cada cliente. Responde con las cifras del sistema." },
  { verb: "Pídale", text: "que cree un cliente, registre una venta, un abono o una compra, o genere un reporte. Usted confirma con un toque." },
  { verb: "Envíele", text: "la foto de una factura o un pedido, un PDF o un Excel: lo lee y deja todo listo." },
  { verb: "Háblele", text: "desde el mostrador o la bodega: le responde en voz alta." },
];

/** Conversación ilustrativa que avanza sola mientras está a la vista; con movimiento reducido queda quieta y completa. */
const ChatDemo = () => {
  const [ref, seen] = useInView<HTMLDivElement>("0px 0px -15% 0px");
  const [scene, setScene] = useState(0);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(STEPS - 1);
      return;
    }
    if (!visible) return;
    const t = window.setTimeout(
      () => {
        if (step < STEPS - 1) setStep((s) => s + 1);
        else {
          setScene((s) => (s + 1) % SCENES.length);
          setStep(0);
        }
      },
      step < STEPS - 1 ? STEP_MS : HOLD_MS,
    );
    return () => window.clearTimeout(t);
  }, [visible, step]);

  const s = SCENES[scene] ?? SCENES[0]!;
  const done = step >= 4;

  return (
    <div ref={ref} className={styles.phone} data-in={seen ? "1" : "0"} aria-hidden="true">
      <div className={styles.phoneHead}>
        <TitaAvatar size={40} thinking={step === 1} />
        <span>
          <strong>Tita</strong>
          <small>Asistente de Mi Tierrita</small>
        </span>
        <em className={styles.who}>{s.who}</em>
      </div>
      <div className={styles.thread} key={scene}>
        {s.voice ? (
          <div className={styles.voice}>
            <i />
            <i />
            <i />
            <i />
            <i />
            <span>Escuchando…</span>
          </div>
        ) : null}
        <div className={styles.userRow}>
          {s.file ? <span className={styles.file}>{s.file}</span> : null}
          <span className={styles.user}>{s.ask}</span>
        </div>
        {step === 1 ? (
          <div className={styles.typing}>
            <i />
            <i />
            <i />
          </div>
        ) : null}
        {step >= 2 ? (
          <div className={styles.reply}>
            <TitaAvatar size={26} />
            <p>{s.reply}</p>
          </div>
        ) : null}
        {step >= 3 ? (
          <div className={[styles.card, done ? styles.cardDone : ""].join(" ")}>
            <div className={styles.cardHead}>
              <strong>{s.card.title}</strong>
              {done ? <span className={styles.ok}>Registrado</span> : null}
            </div>
            {s.card.lines.map((l) => (
              <span key={l} className={styles.cardLine}>
                {l}
              </span>
            ))}
            {!done ? <span className={styles.confirm}>{s.card.confirm}</span> : null}
          </div>
        ) : null}
      </div>
      <div className={styles.dots}>
        {SCENES.map((x, i) => (
          <i key={x.ask} data-on={i === scene ? "1" : "0"} />
        ))}
      </div>
    </div>
  );
};

/** "Conozca a Tita": la asistente del sistema presentada a clientes y visitantes, con una conversación ilustrativa. */
export const LandingTita = () => (
  <section className={[base.section, styles.tita].join(" ")} id="tita" aria-labelledby="tita-title">
    <div className={styles.layout}>
      <div className={styles.text}>
        <span className={base.eyebrow}>Conozca a Tita</span>
        <h2 id="tita-title" className={base.sectionTitle}>
          <SplitText text={"La asistente que se sabe\n*la tienda de memoria.*"} />
        </h2>
        <p className={base.sectionLead}>
          Tita vive dentro del sistema y trabaja con el equipo: consulta, explica y deja listo lo que le pidan, con los datos reales de la tienda y los permisos
          de cada persona.
        </p>
        <ul className={styles.points}>
          {POINTS.map((p, i) => (
            <Reveal key={p.verb} delay={i * 90}>
              <li>
                <strong>{p.verb}</strong>
                <span>{p.text}</span>
              </li>
            </Reveal>
          ))}
        </ul>
        <p className={styles.trust}>Nada se registra sin que alguien del equipo lo confirme, y todo queda en la auditoría del sistema.</p>
      </div>
      <div className={styles.visual}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.mascot} aria-hidden="true">
          <TitaAvatar size={112} />
        </div>
        <ChatDemo />
        <p className={styles.caption}>Conversación ilustrativa · cifras de ejemplo</p>
      </div>
    </div>
  </section>
);
