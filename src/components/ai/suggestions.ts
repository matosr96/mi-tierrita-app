import type { AiScreen, Role } from "@/types/api";

/** Preguntas de ejemplo por rol: lo que de verdad pregunta o pide cada puesto en la tienda. */
export const SUGGESTIONS: Record<Role, string[]> = {
  ADMIN: ["¿Cómo van las ventas de este mes frente al mes pasado?", "¿Qué debo reponer esta semana y cuánto?", "Súbale 200 pesos al precio de venta del arroz", "Genere el reporte de cartera"],
  SALES: ["¿Cuánto vendimos hoy y cuánto fue a crédito?", "¿A quién debo cobrar primero?", "Cree el cliente Pedro Gómez, cédula 1067889900", "Venda 2 arroz de contado"],
  WAREHOUSE: ["¿Qué lotes vencen esta semana?", "¿Qué productos se van a acabar pronto?", "Registre la compra de 24 leches que vencen en diciembre", "¿Qué productos no se están vendiendo?"],
};

/**
 * Preguntas sugeridas según la pantalla desde la que se abre a Tita (brief de octubre de 2026, punto 6). Solo se
 * ofrecen las que el rol puede responder con sus herramientas; donde una pantalla no tiene nada propio, se usan las
 * del rol.
 */
export const SCREEN_SUGGESTIONS: Partial<Record<AiScreen, Partial<Record<Role, string[]>>>> = {
  inventario: {
    ADMIN: ["¿Qué productos tienen stock bajo?", "¿Cuánto vale el inventario a costo y a precio de venta?", "¿Qué productos no se han vendido en 30 días?"],
    SALES: ["¿Qué productos tienen stock bajo?", "¿Cuál es el precio de venta del concentrado para pollos?"],
    WAREHOUSE: ["¿Qué productos tienen stock bajo?", "¿Qué productos no se están vendiendo?", "Cree el producto Sal mineralizada 25 kg en la línea de ganadería"],
  },
  lotes: {
    ADMIN: ["¿Qué lotes vencen esta semana?", "¿Cuánto cuesta lo que ya venció?", "¿Qué lote conviene rotar primero?"],
    WAREHOUSE: ["¿Qué lotes vencen esta semana?", "Registre un lote de 20 leches que vence en diciembre", "¿Qué lotes vencidos hay que retirar?"],
  },
  ventas: {
    ADMIN: ["¿Cuánto vendimos hoy y cuánto fue a crédito?", "¿Cuál fue el producto más vendido este mes?", "Busque la factura de ayer de Pedro Gómez"],
    SALES: ["¿Cuánto vendimos hoy?", "Venda 2 arroz de contado", "¿Qué ticket promedio llevamos esta semana?"],
  },
  clientes: {
    ADMIN: ["¿A quién debo cobrar primero?", "¿Cuánto es la cartera vencida?", "Registre un abono de 50.000 de Pedro Gómez"],
    SALES: ["¿A quién debo cobrar primero?", "¿Cuánto cupo le queda a Pedro Gómez?", "Redácteme un mensaje de cobro para quien más debe"],
  },
  proveedores: {
    ADMIN: ["¿A qué proveedor le compré las últimas veces el concentrado?", "Registre la compra de 24 leches que vencen en diciembre"],
    WAREHOUSE: ["¿Qué proveedores están activos?", "Registre la compra de 24 leches que vencen en diciembre", "Cree el proveedor Agroinsumos del Sinú"],
  },
  finanzas: { ADMIN: ["¿Me conviene la ampliación según el escenario base?", "¿Qué pasa con el VPN si la demanda baja 10 %?", "Explíqueme la cuota del crédito"] },
  reportes: { ADMIN: ["Genere el reporte de ventas de este mes", "Genere el reporte de cartera", "¿Qué dice el reporte de inventario?"], SALES: ["Genere el reporte de ventas de esta semana", "¿Cuánto vendimos por producto este mes?"] },
  chat: { ADMIN: ["Escríbale al equipo que mañana hay conteo de inventario", "¿Quién está en línea?"], SALES: ["Avísele a bodega que se acabó el arroz"], WAREHOUSE: ["Avísele a caja que llegó el pedido de concentrado"] },
  alarmas: {
    ADMIN: ["Cree una alarma para revisar lotes por vencer a las 7:30", "Cree una alarma del cierre de caja a las 5:30 p. m. todos los días"],
    SALES: ["Cree una alarma del cierre de caja a las 5:30 p. m. todos los días"],
    WAREHOUSE: ["Cree una alarma para revisar lotes por vencer a las 7:30"],
  },
  inicio: { ADMIN: ["¿Está todo bien hoy?", "¿Qué debo atender primero?"], SALES: ["¿Qué debo atender primero hoy?"], WAREHOUSE: ["¿Qué debo atender primero hoy?"] },
};

export const SCREEN_LABEL: Record<AiScreen, string> = {
  inicio: "Inicio",
  inventario: "Inventario",
  lotes: "Lotes y vencimientos",
  ventas: "Ventas",
  clientes: "Clientes y cartera",
  proveedores: "Proveedores",
  finanzas: "Finanzas",
  reportes: "Reportes",
  tita: "Tita",
  chat: "Chat del equipo",
  contactos: "Contactos",
  usuarios: "Usuarios",
  auditoria: "Auditoría",
  alarmas: "Alarmas",
  perfil: "Mi perfil",
};

/** Sugerencias para una pantalla y rol: las de la pantalla si las hay, si no las del rol. */
export const suggestionsFor = (role: Role, screen: AiScreen | undefined): { title: string | null; items: string[] } => {
  const own = screen ? SCREEN_SUGGESTIONS[screen]?.[role] : undefined;
  if (own && own.length > 0 && screen && screen !== "tita") return { title: `Sobre ${SCREEN_LABEL[screen]}`, items: own };
  return { title: null, items: SUGGESTIONS[role] };
};
