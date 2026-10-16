import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Reveal, SplitText } from "@/components/motion";
import { STORE, hasContactChannel } from "./content";
import styles from "./Landing.module.css";

/**
 * Pedidos y cotizaciones. No hay servicio de mensajes en la API: el formulario arma el texto y lo abre en WhatsApp
 * o en el correo de la tienda. Sin canales configurados, invita a pasar por el local.
 */
export const LandingContact = () => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const text = () => `Hola, Mi Tierrita. Soy ${name.trim()}.\n\n${message.trim()}`;
  const sendWhatsapp = (e: FormEvent) => {
    e.preventDefault();
    if (STORE.whatsapp) window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text())}`, "_blank", "noopener");
    else if (STORE.email) window.location.href = `mailto:${STORE.email}?subject=${encodeURIComponent("Cotización")}&body=${encodeURIComponent(text())}`;
  };

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
          {hasContactChannel() ? (
            <form className={styles.contactForm} onSubmit={sendWhatsapp}>
              <label>
                <span>Nombre</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </label>
              <label>
                <span>Mensaje</span>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} placeholder="Producto, cantidades y para cuándo lo necesita." />
              </label>
              <button type="submit" className={styles.btnPrimary}>
                {STORE.whatsapp ? "Enviar por WhatsApp" : "Enviar por correo"}
                <span aria-hidden="true">→</span>
              </button>
              <p className={styles.formNote}>El mensaje se abre en {STORE.whatsapp ? "WhatsApp" : "su correo"}; sus datos solo se usan para responderle.</p>
            </form>
          ) : (
            <div className={styles.contactCard}>
              <p>Pase por el mostrador en {STORE.city}: allí le cotizamos y separamos su pedido.</p>
              <a href="#visitenos" className={styles.btnPrimary}>
                Cómo llegar
                <span aria-hidden="true">↑</span>
              </a>
              <p className={styles.formNote}>
                ¿Trabaja en la tienda? <Link to="/iniciar-sesion">Ingrese al sistema</Link>.
              </p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
};
