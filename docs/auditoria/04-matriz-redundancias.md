# 4. Matriz de redundancias

Elementos que se repetían. Para cada uno: dónde aparecía, la decisión tomada y por qué. Solo se quitó lo que repetía
**la misma información con el mismo propósito** en la misma vista o lo que duplicaba código; un mismo dato en
pantallas con propósitos distintos (por ejemplo, el valor del inventario en el Inicio y en Inventario) se conserva.

| # | Elemento | Dónde aparecía | Tipo | Decisión | Motivo |
|---|---|---|---|---|---|
| R-01 | Lista de pendientes de cobro (caja) | Tarjeta destacada del Inicio · tarjeta "Pendientes de hoy" del Inicio · campana · insignia de Clientes | Misma vista, mismo dato y mismo uso | **Quitar** "Pendientes de hoy" del Inicio; conservar tarjeta destacada, campana e insignia | La campana sirve en cualquier pantalla y la insignia es un conteo; las dos tarjetas del Inicio eran iguales (AUD-10) |
| R-02 | "Qué hacer hoy" (bodega) | Tarjeta destacada del Inicio · tarjeta "Qué hacer hoy" · campana | Misma vista, mismo dato | **Quitar** "Qué hacer hoy" | Igual que R-01 |
| R-03 | Contado y crédito de hoy | Indicadores "Contado hoy" y "Crédito hoy" · donut "Hoy en caja" | Misma vista, misma cifra | **Quitar** el donut | Con dos valores, el gráfico no agrega lectura (AUD-11) |
| R-04 | Lotes vencidos | Aviso · indicador · leyenda del estante · tarjeta "Distribución" (Lotes) | Misma vista, cuatro veces | **Quitar** "Distribución" | Aviso, indicador y estante tienen usos distintos (alerta, cifra, ubicación); los mosaicos solo repetían (AUD-14) |
| R-05 | Cambiar mi contraseña | Botón del encabezado de Usuarios · botón en la tarjeta propia · Mi perfil › Seguridad | Tres entradas y dos implementaciones | **Una sola** implementación en Mi perfil; la tarjeta propia lleva allí | Menos código y un solo lugar para lo personal (AUD-16) |
| R-06 | Pestañas | `Tabs` del kit · `FinanceTabs` de Finanzas | Código duplicado | **Unificar** en `Tabs` | Mismo comportamiento con dos estilos distintos (AUD-15) |
| R-07 | Saludo | Encabezado del Inicio · título de la tarjeta destacada mientras carga | Misma vista | **Quitar** el del estado de carga | AUD-21 |
| R-08 | Umbral de "pocas unidades" | `Home/attention.ts` · `Inventory/stockStatus.ts` | Constante duplicada | **Una sola** en `stockStatus.ts` | Evita que difieran |
| R-09 | Valor del inventario | Inicio de administración · Inventario | Mismo dato, distinto propósito | **Conservar** | En el Inicio es resumen; en Inventario abre el detalle por línea |
| R-10 | Ventas del mes | Inicio de administración · Reportes | Mismo dato, distinto propósito | **Conservar** | Reportes es el documento exportable con parámetros |
| R-11 | Pendientes del día | Tarjeta destacada · campana · insignias del menú | Mismo origen (`useNotifications` comparte caché) | **Conservar** | Cada uno sirve en un contexto distinto (Inicio, cualquier pantalla, navegación); no duplican peticiones |
| R-12 | Rótulo de rol y estado | Inicio de administración (píldoras) · Mi perfil | Distinto propósito | **Conservar** | — |

Resultado: 6 bloques de interfaz y 3 archivos menos (`DistributionCard.tsx`, `FinanceTabs.tsx` con su CSS,
`ChangePasswordModal.tsx`), más 2 de código muerto (`AttentionCard.tsx`, `AttentionList.tsx`). No se quitó ninguna
capacidad: todo lo que mostraban esos bloques sigue visible una vez.
