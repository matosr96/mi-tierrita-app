import type { Role } from "@/types/api";

/**
 * Manual de Tita dentro de la app (brief de octubre de 2026, punto 11). Todo lo que se describe existe en el código:
 * las herramientas de consulta y de acción de `business-logic/ai/tools.ts` y `actions.ts` de la API, el flujo en dos
 * pasos, el historial, las tarjetas con confirmación y los avisos de error de `useTitaConversation`.
 */
export type ManualSection = { id: string; title: string; paragraphs: string[]; steps?: string[]; bullets?: string[] };

export const GENERAL_MANUAL: ManualSection[] = [
  {
    id: "que-es",
    title: "Qué es Tita y para qué sirve",
    paragraphs: [
      "Tita es la asistente de Mi Tierrita. Responde con los datos reales del sistema que su cuenta puede ver (inventario, lotes, ventas, clientes, cartera, proveedores, reportes y escenarios) y prepara por usted lo que su cuenta puede hacer.",
      "Principio de trabajo: las cifras salen del servidor; Tita consulta, explica y prepara. Nada se registra sin que una persona lo confirme.",
    ],
  },
  {
    id: "como-abrirla",
    title: "Cómo abrirla",
    paragraphs: ["Hay tres caminos y todos llevan a la misma conversación."],
    bullets: [
      "El orbe flotante abajo a la derecha, en cualquier pantalla, abre el panel rápido. También el botón «Tita» de la barra superior o el atajo Ctrl+J (⌘J en Mac).",
      "La página «Tita» del menú (grupo Comunicación) muestra la conversación amplia, lo que puede hacer por su rol y las sugerencias del día.",
      "La tarjeta «Sugerencias de hoy» del Inicio trae preguntas listas: al tocar una se abre Tita con esa pregunta.",
    ],
  },
  {
    id: "como-preguntar",
    title: "Cómo preguntarle y qué sugiere según la pantalla",
    paragraphs: [
      "Escriba como le hablaría a una compañera: «¿qué lotes vencen esta semana?», «venda 2 arroz de contado», «¿a quién debo cobrar primero?». Puede adjuntar fotos y documentos (PDF, Excel, CSV, texto; hasta 4 por pregunta) o hablarle con el micrófono.",
      "Tita sabe desde qué pantalla le habla: si abre el panel en Inventario le ofrece preguntas de inventario («¿qué productos tienen stock bajo?») y en Clientes, de cartera. En su respuesta puede incluir atajos a la pantalla o pestaña exacta.",
      "Mientras escribe, una sugerencia en gris propone cómo terminar la pregunta: acéptela con Tab o tocándola. Si no sirve, siga escribiendo.",
    ],
  },
  {
    id: "historial",
    title: "Historial y «Nueva conversación»",
    paragraphs: ["Cada conversación queda guardada a su nombre y solo usted la ve. Los archivos adjuntos no se guardan: solo su nombre."],
    bullets: [
      "«Historial» (en el panel y en la página) lista sus conversaciones anteriores: toque una para retomarla donde la dejó, o elimínela.",
      "«Nueva conversación» empieza de cero. La anterior sigue en el historial.",
    ],
  },
  {
    id: "confirmacion",
    title: "Acciones con confirmación",
    paragraphs: [
      "Cuando le pide que registre algo (un cliente, una venta, un abono, una compra, un lote, una alarma…), Tita no lo hace de inmediato: deja una tarjeta con lo que va a hacer, con los avisos del caso, y dos botones.",
    ],
    steps: [
      "Revise la tarjeta: qué se registra, cantidades, precios o fechas.",
      "Pulse «Confirmar» para ejecutarlo. Pasa por las mismas reglas, permisos y validaciones que si lo hiciera desde la pantalla, y queda en la auditoría a su nombre con la marca IA.",
      "Pulse «Descartar» si no es lo que quería. Puede pedirle a Tita que lo corrija.",
      "En ventas, abonos y compras también está «Revisar en su pantalla»: abre el formulario ya diligenciado para terminarlo allí.",
    ],
  },
  {
    id: "mencion",
    title: "Mención @Tita en el chat del equipo",
    paragraphs: [
      "En el chat del equipo puede escribir «@Tita» seguido de la pregunta y ella responde en la misma conversación, con los datos que la persona que la mencionó puede ver. Si la respuesta trae una tarjeta de acción, solo quien la invocó puede confirmarla o descartarla.",
    ],
  },
  {
    id: "errores",
    title: "Qué hacer ante cada aviso de error",
    paragraphs: ["Tita responde en dos pasos: recibe la pregunta al instante y la app consulta la respuesta cada segundo y medio, así una red lenta no la corta. Si algo falla, el aviso dice qué pasó:"],
    bullets: [
      "«Sin conexión»: no hay red con el servidor. La app reintenta sola el envío varias veces y espera a que vuelva la red; si no vuelve, revise la conexión y pulse «Intentar de nuevo».",
      "«Tardó demasiado»: pasaron más de tres minutos sin respuesta. Pulse «Intentar de nuevo» o pregunte algo más concreto; si Tita terminó en el servidor, la respuesta aparece al retomar la conversación desde el historial.",
      "«Error con código»: la API respondió con un código (por ejemplo 613, sin permiso; 640, demasiadas consultas en cinco minutos; 661, el proveedor de IA no respondió). La app no reintenta sola. Si se repite, repórtelo al administrador con ese código.",
      "«Tita no está disponible»: el servidor no tiene configurada la IA. El resto del sistema funciona igual.",
    ],
  },
];

export type RoleManual = { role: Role; title: string; intro: string; canAsk: string[]; canDo: string[]; examples: string[]; cannot: string[] };

export const ROLE_MANUALS: Record<Role, RoleManual> = {
  ADMIN: {
    role: "ADMIN",
    title: "Manual de Tita para Administración",
    intro: "La cuenta de administración ve todo el sistema, así que Tita puede consultar y preparar cualquier operación.",
    canAsk: [
      "Productos, existencias vendibles, precios y categorías; lotes de un producto y lotes por vencer.",
      "Clientes, saldos, cupos y cartera vencida; ventas recientes, resumen de ventas por período y búsqueda de una factura.",
      "Reporte de inventario (valorizado, por vencer y vencidos) y reporte de cartera.",
      "Proveedores, escenarios financieros (cuota, VPN, TIR), contactos del sitio público, el equipo y las recomendaciones del día.",
      "Pedidos abiertos a proveedores y de clientes (atrasados y por llegar o entregar), la próxima nómina por pagar con su neto y los conteos de inventario programados.",
    ],
    canDo: [
      "Crear y actualizar clientes; registrar abonos; registrar y anular ventas.",
      "Crear, actualizar y desactivar productos; crear categorías; registrar lotes y compras; crear y actualizar proveedores.",
      "Crear escenarios financieros; atender o archivar contactos del sitio; escribirle al equipo; generar reportes; crear alarmas.",
    ],
    examples: ["¿Cómo van las ventas de este mes frente al mes pasado?", "Súbale 200 pesos al precio de venta del arroz", "Anule la factura FAC-000120", "Genere el reporte de cartera", "Cree una alarma del cierre de caja a las 5:30 p. m. todos los días"],
    cannot: ["Crear usuarios ni cambiar contraseñas: eso se hace en Usuarios y roles.", "Registrar algo sin que usted pulse «Confirmar»."],
  },
  SALES: {
    role: "SALES",
    title: "Manual de Tita para Secretaria (caja)",
    intro: "La cuenta de caja trabaja con ventas y clientes. Tita consulta y prepara eso; no tiene acceso a finanzas ni al inventario valorizado.",
    canAsk: [
      "Productos, precios de venta y existencias vendibles; lotes de un producto; categorías.",
      "Clientes, saldos y cupos; ventas recientes, resumen de ventas por período y búsqueda de una factura.",
      "El equipo (para escribirle) y las recomendaciones del día (cobrar, reponer).",
      "Encargos de clientes por entregar o atrasados.",
    ],
    canDo: ["Crear y actualizar clientes; registrar abonos; registrar ventas (de contado o a crédito).", "Generar el reporte de ventas; redactar mensajes de cobro; escribirle al equipo; crear alarmas."],
    examples: ["¿Cuánto vendimos hoy y cuánto fue a crédito?", "¿A quién debo cobrar primero?", "Cree el cliente Pedro Gómez, cédula 1067889900", "Venda 2 arroz de contado", "Redácteme un mensaje de cobro para Marta Pérez"],
    cannot: [
      "Finanzas y escenarios, reporte de inventario y de cartera, lotes por vencer, proveedores, pedidos a proveedores, nómina y conteos: Tita responde que no está disponible para su cuenta.",
      "Anular ventas, desactivar productos, registrar compras o lotes.",
      "Crear usuarios ni cambiar contraseñas.",
    ],
  },
  WAREHOUSE: {
    role: "WAREHOUSE",
    title: "Manual de Tita para Bodega",
    intro: "La cuenta de bodega maneja productos, lotes y compras. Tita consulta y prepara eso; no tiene acceso a clientes, cartera ni ventas.",
    canAsk: [
      "Productos, existencias vendibles y categorías; lotes de un producto y lotes por vencer.",
      "Proveedores activos; el equipo; las recomendaciones del día (reponer, rotar, sin rotación).",
      "Pedidos a proveedores por llegar o atrasados y los conteos de inventario programados.",
    ],
    canDo: [
      "Crear y actualizar productos; crear categorías; registrar lotes y compras (también desde la foto de una factura).",
      "Crear y actualizar proveedores; escribirle al equipo; crear alarmas.",
    ],
    examples: ["¿Qué lotes vencen esta semana?", "¿Qué productos se van a acabar pronto?", "Registre la compra de 24 leches que vencen en diciembre", "Cree el producto Sal mineralizada 25 kg en la línea de ganadería"],
    cannot: [
      "Clientes, saldos, cartera, ventas, reportes de ventas, encargos de clientes y nómina: Tita responde que no está disponible para su cuenta.",
      "Registrar ventas o abonos, anular ventas, desactivar productos, crear escenarios.",
      "Crear usuarios ni cambiar contraseñas.",
    ],
  },
};

export const ROLE_SLUG: Record<string, Role> = { admin: "ADMIN", administrador: "ADMIN", sales: "SALES", secretaria: "SALES", warehouse: "WAREHOUSE", bodega: "WAREHOUSE" };
