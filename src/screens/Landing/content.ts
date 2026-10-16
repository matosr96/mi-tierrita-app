/**
 * Contenido de la página pública. Todo lo que dice la página sale de aquí, para corregirlo sin tocar el diseño.
 * Los datos de contacto vacíos ocultan su bloque: no se publica nada que no esté confirmado por la tienda.
 */

export const STORE = {
  name: "Mi Tierrita",
  kind: "Agropecuaria",
  city: "Sahagún, Córdoba",
  country: "Colombia",
  /** Dirección exacta del local (vacío = solo se muestra la ciudad). */
  address: "",
  /** Horario de atención, p. ej. "Lunes a sábado · 7:00 a. m. – 6:00 p. m." (vacío = no se muestra). */
  hours: "",
  /** WhatsApp con indicativo, solo dígitos, p. ej. "573001234567" (vacío = sin botón de WhatsApp). */
  whatsapp: "",
  /** Correo de la tienda (vacío = sin envío por correo). */
  email: "",
} as const;

export const hasContactChannel = () => Boolean(STORE.whatsapp || STORE.email);

export type ProductLine = { code: string; name: string; accent: string; text: string; tags: string[] };

/** Líneas de producto de la tienda (catálogo de la página pública v4.1). */
export const LINES: ProductLine[] = [
  { code: "01", name: "Alimentos", accent: "balanceados", text: "Concentrados para ganado, cerdos, aves y mascotas.", tags: ["Ganado", "Cerdos", "Aves", "Mascotas"] },
  { code: "02", name: "Medicina", accent: "veterinaria", text: "Vacunas, desparasitantes y vitaminas, con control de lote y vencimiento.", tags: ["Vacunas", "Desparasitantes", "Vitaminas"] },
  { code: "03", name: "Semillas y", accent: "fertilizantes", text: "Maíz, pastos y abonos para cada temporada.", tags: ["Maíz", "Pastos", "Abonos"] },
  { code: "04", name: "Aves de", accent: "corral", text: "Pollitas ponedoras y pollos de engorde.", tags: ["Ponedoras", "Engorde"] },
  { code: "05", name: "Productos", accent: "agroquímicos", text: "Herbicidas, insecticidas y fungicidas de uso agrícola.", tags: ["Herbicidas", "Insecticidas", "Fungicidas"] },
  { code: "06", name: "Ferretería", accent: "agrícola", text: "Machetes, alambre, mangueras y herramienta de finca.", tags: ["Machetes", "Alambre", "Mangueras"] },
];

export type Chapter = { code: string; eyebrow: string; title: string; accent: string; text: string; points: string[] };

/** Lo que de verdad hace el sistema (módulos implementados en la app). */
export const CHAPTERS: Chapter[] = [
  {
    code: "01",
    eyebrow: "Bodega y mostrador",
    title: "Inventario que avisa",
    accent: "antes de perder.",
    text: "Cada compra entra como un lote con su fecha de vencimiento. Las ventas descuentan primero el lote que vence antes y el sistema señala lo que está por vencer.",
    points: ["Lotes y vencimientos por producto", "Salida FEFO: primero en vencer, primero en salir", "Proveedores y compras en un solo lugar"],
  },
  {
    code: "02",
    eyebrow: "Clientes y caja",
    title: "Ventas y cartera",
    accent: "bajo control.",
    text: "El punto de venta registra contado y crédito, respeta el cupo de cada cliente y los abonos bajan el saldo al instante.",
    points: ["Punto de venta con factura", "Cupo de crédito y abonos por cliente", "Cartera vencida a la vista"],
  },
  {
    code: "03",
    eyebrow: "Decisión de crecer",
    title: "¿Conviene ampliar",
    accent: "el local?",
    text: "La evaluación financiera arma escenarios con la inversión, el crédito y el aumento de ventas esperado, y calcula VPN, TIR, cuota y cuánto pueden fallar las ventas antes de dejar de convenir.",
    points: ["Escenarios comparables", "VPN, TIR y cobertura de la cuota", "Sensibilidad y punto de quiebre"],
  },
];

export const TEAM = [
  { initials: "KR", name: "Karina Redondo Sáez", role: "Sistemas de Información Gerencial · Ingeniería Económica" },
  { initials: "AR", name: "Alexa Patricia Ricardo Lozano", role: "Sistemas de Información Gerencial · Ingeniería Económica" },
  { initials: "EM", name: "Edgar Alexander Matos Rivera", role: "Ingeniería Económica" },
];

export const ADVISORS = [
  { initials: "LS", name: "Esp. Luis Antonio Sarruf Durango", course: "Sistemas de Información Gerencial" },
  { initials: "EC", name: "Estrella del Carmen Camacho Alvis", course: "Ingeniería Económica" },
];

export const ACADEMIC = "Universidad de Cartagena · Ingeniería de Software · Cereté · 2026-2";
