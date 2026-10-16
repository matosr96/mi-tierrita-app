import { useState, type FormEvent } from "react";
import { Reveal, SplitText } from "@/components/motion";
import { useSendContact } from "@/hooks/contact";
import { fieldErrors } from "@/lib/errors";
import styles from "./Landing.module.css";

const TOPICS = ["Cotización", "Pedido grande", "Disponibilidad de un producto", "Otro"];

/**
 * Pedidos y cotizaciones: el mensaje llega a la bandeja "Contactos del sitio" del sistema (POST /contact).
 * Pide un teléfono o un correo para responder; `website` es un campo trampa invisible para robots.
 */
export const LandingContact = () => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", topic: TOPICS[0]!, body: "", website: "" });
  const [localError, setLocalError] = useState<string | null>(null);
  const send = useSendContact();
  const errs = send.error ? fieldErrors(send.error) : {};
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim() && !form.email.trim()) {
      setLocalError("Deje un teléfono o un correo para poder responderle.");
      return;
    }
    setLocalError(null);
    try {
      await send.mutateAsync({
        name: form.name.trim(),
        body: form.body.trim(),
        topic: form.topic,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        ...(form.website ? { website: form.website } : {}),
      });
    } catch {
      /* el error queda en la mutación y se muestra bajo el formulario */
    }
  };

  const general = localError ?? (send.error && Object.keys(errs).length === 0 ? send.error.message : null);

  return (
    <section className={[styles.section, styles.contact].join(" ")} id="contacto" aria-labelledby="contacto-title">
      <div className={styles.contactGrid}>
        <div>
          <span className={styles.eyebrow}>
            <span>05</span>Pedidos y cotizaciones
          </span>
          <h2 id="contacto-title" className={styles.sectionTitle}>
            <SplitText text={"¿Necesita una cotización\n*o un pedido grande?*"} />
          </h2>
          <p className={styles.sectionLead}>Cuéntenos qué producto busca, cantidades y para cuándo. Le respondemos con disponibilidad y precio.</p>
        </div>
        <Reveal variant="rise" delay={150}>
          {send.isSuccess ? (
            <div className={styles.contactCard} role="status">
              <p>
                <strong>¡Recibido, {form.name.trim().split(" ")[0]}!</strong> Su mensaje ya está en la tienda. Le respondemos por {form.phone.trim() ? "teléfono o WhatsApp" : "correo"} lo
                antes posible.
              </p>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => {
                  send.reset();
                  setForm((f) => ({ ...f, body: "" }));
                }}
              >
                Enviar otro mensaje
                <span aria-hidden="true">↺</span>
              </button>
            </div>
          ) : (
            <form className={styles.contactForm} onSubmit={submit} noValidate>
              <label>
                <span>Nombre</span>
                <input value={form.name} onChange={set("name")} required minLength={2} maxLength={100} autoComplete="name" aria-invalid={Boolean(errs.name)} />
                {errs.name ? <em className={styles.fieldError}>{errs.name}</em> : null}
              </label>
              <div className={styles.formRow}>
                <label>
                  <span>Teléfono o WhatsApp</span>
                  <input type="tel" value={form.phone} onChange={set("phone")} maxLength={30} autoComplete="tel" aria-invalid={Boolean(errs.phone)} />
                  {errs.phone ? <em className={styles.fieldError}>{errs.phone}</em> : null}
                </label>
                <label>
                  <span>Correo (opcional)</span>
                  <input type="email" value={form.email} onChange={set("email")} maxLength={120} autoComplete="email" aria-invalid={Boolean(errs.email)} />
                  {errs.email ? <em className={styles.fieldError}>{errs.email}</em> : null}
                </label>
              </div>
              <label>
                <span>Tema</span>
                <select value={form.topic} onChange={set("topic")}>
                  {TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Mensaje</span>
                <textarea value={form.body} onChange={set("body")} required minLength={5} maxLength={2000} rows={4} placeholder="Producto, cantidades y para cuándo lo necesita." aria-invalid={Boolean(errs.body)} />
                {errs.body ? <em className={styles.fieldError}>{errs.body}</em> : null}
              </label>
              {/* Campo trampa: las personas no lo ven; si un robot lo llena, el mensaje se descarta. */}
              <label className={styles.trap} aria-hidden="true">
                <span>Sitio web</span>
                <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
              </label>
              {general ? <p className={styles.formError}>{general}</p> : null}
              <button type="submit" className={styles.btnPrimary} disabled={send.isPending}>
                {send.isPending ? "Enviando…" : "Enviar mensaje"}
                <span aria-hidden="true">→</span>
              </button>
              <p className={styles.formNote}>Sus datos solo se usan para responderle.</p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
};
