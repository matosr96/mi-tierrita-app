import { PageHeader } from "@/components/layout/AppShell";
import { Button, Card, EmptyState, Loading } from "@/components/ui";
import { TitaAvatar } from "@/components/ai/TitaAvatar";
import { TitaConversation } from "@/components/ai/TitaConversation";
import { useAiStatus, useBriefing, useTitaConversation } from "@/hooks/ai";
import { useSessionStore } from "@/stores/session";
import { toRow } from "@/screens/Home/BriefingCard";
import type { Role } from "@/types/api";
import styles from "./TitaScreen.module.css";

/** Lo que cada puesto le puede pedir a Tita (las mismas herramientas que el servidor le da a ese rol). */
const CAN_DO: Record<Role, string[]> = {
  ADMIN: [
    "Consultar y comparar ventas, inventario, cartera y el escenario de ampliación.",
    "Crear y editar clientes, productos, categorías y proveedores; cambiar precios.",
    "Registrar ventas, abonos, compras y lotes; anular ventas; crear escenarios.",
    "Generar reportes, leer facturas y documentos, y escribirle al equipo.",
  ],
  SALES: [
    "Saldos, cupos y compras de cada cliente; ventas del día o de cualquier período.",
    "Crear y editar clientes; registrar ventas y abonos.",
    "Generar el reporte de ventas y redactar mensajes de cobro.",
    "Leer fotos o documentos (pedidos, listas) y escribirle al equipo.",
  ],
  WAREHOUSE: [
    "Existencias vendibles, lotes y vencimientos de cada producto.",
    "Crear y editar productos, categorías y proveedores.",
    "Registrar compras y lotes, también desde la foto de una factura.",
    "Saber qué reponer y qué no se mueve; escribirle al equipo.",
  ],
};

/** Pregunta lista para cada sugerencia del día (la de cobro pide el mensaje dentro de la conversación). */
const promptFor = (row: ReturnType<typeof toRow>): string =>
  row.ask?.prompt ?? (row.collect ? `Redácteme un mensaje de WhatsApp cordial para cobrarle a ${row.collect.name} su saldo.` : row.text);

/**
 * Página de Tita: la conversación amplia al centro y, al lado, quién es, qué se le puede pedir según el rol y las
 * sugerencias de hoy como preguntas listas. Comparte la conversación con el panel rápido de la barra.
 */
export const TitaScreen = () => {
  const ai = useAiStatus();
  const user = useSessionStore((s) => s.user);
  const briefing = useBriefing();
  const { messages, pending, send, reset } = useTitaConversation();

  if (ai.isPending) return <Loading text="Buscando a Tita…" />;
  if (!ai.enabled || !user) {
    return (
      <>
        <PageHeader title="Tita" subtitle="La asistente de Mi Tierrita" />
        <Card>
          <EmptyState title="Tita no está disponible" text="El servidor no tiene configurada la IA. El resto del sistema funciona igual." />
        </Card>
      </>
    );
  }

  const rows = (briefing.data?.insights ?? []).map(toRow).slice(0, 4);

  return (
    <>
      <PageHeader
        title="Tita"
        subtitle="La asistente de Mi Tierrita: responde con los datos del sistema que su cuenta puede ver."
        actions={
          messages.length > 0 ? (
            <Button variant="secondary" onClick={reset} disabled={pending}>
              Nueva conversación
            </Button>
          ) : undefined
        }
      />

      <div className={styles.layout}>
        <section className={styles.chat} aria-label="Conversación con Tita">
          <TitaConversation />
        </section>

        <aside className={styles.side}>
          <Card>
            <div className={styles.who}>
              <TitaAvatar size={64} />
              <div>
                <strong>Tita</strong>
                <span>Asistente de Mi Tierrita</span>
              </div>
            </div>
            <p className={styles.bio}>
              Se sabe la tienda de memoria. Le responde con las cifras del sistema y hace por usted lo que su cuenta puede hacer: usted confirma cada
              cosa con un toque. Puede escribirle, enviarle fotos y documentos, o hablarle.
            </p>
          </Card>

          <Card title="Lo que puede hacer por usted">
            <ul className={styles.can}>
              {CAN_DO[user.role].map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Card>

          {rows.length > 0 ? (
            <Card title="Para hoy" subtitle="Toque una para preguntarle a Tita">
              <ul className={styles.today}>
                {rows.map((r) => (
                  <li key={r.key}>
                    <button type="button" onClick={() => void send(promptFor(r))} disabled={pending}>
                      <span className={[styles.tag, styles[r.tone]].join(" ")}>{r.tag}</span>
                      <span className={styles.todayText}>{r.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <p className={styles.privacy}>
            La conversación no se guarda: se borra al cerrar sesión. Todo lo que usted confirma pasa por las mismas reglas y permisos del sistema y queda en la
            auditoría a su nombre, con la marca IA. Tita no crea usuarios ni maneja contraseñas.
          </p>
        </aside>
      </div>
    </>
  );
};
