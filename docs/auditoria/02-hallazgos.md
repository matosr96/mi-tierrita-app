# 2. Inventario de hallazgos

Auditoría del 16 de octubre de 2026 sobre la app (`mi-tierrita-app`, base `ee3738c` más el rediseño sin publicar) y la
API (`mi-tierrita-api`, base `85062e2`), en local (app en `:5173`, API en `:4300`, PostgreSQL en Docker).

Cada hallazgo se observó en ejecución: en el navegador con las tres cuentas de prueba (administración, caja y bodega)
o con llamadas reales a la API. La columna **Estado** dice si se corrigió y se volvió a verificar, o si queda pendiente.

Prioridades: **Crítica** (pérdida o corrupción de datos, seguridad), **Alta** (regla de negocio rota o tarea que
falla), **Media** (información engañosa, accesibilidad, diseño adaptable roto), **Baja** (redundancia, consistencia,
código muerto).

## Resumen

| ID | Módulo | Hallazgo | Prioridad | Estado |
|---|---|---|---|---|
| AUD-01 | Transversal (API y app) | "Hoy" y los cortes por fecha se calculaban en UTC | Alta | Corregido |
| AUD-02 | Ventas › Punto de venta | Se ofrecían unidades vencidas que la venta luego rechazaba | Alta | Corregido |
| AUD-03 | Lotes / Proveedores (API) | La API aceptaba lotes que ya llegaban vencidos | Alta | Corregido |
| AUD-04 | Reportes (API) | El reporte de ventas aceptaba un rango invertido | Media | Corregido |
| AUD-05 | Inventario | Las unidades vencidas se mostraban como existencias normales | Media | Corregido |
| AUD-06 | Inicio (administración) | La actividad mostraba solo la hora de ventas de otros días | Media | Corregido |
| AUD-07 | Barra superior | El módulo con candado era casi invisible y no se anunciaba | Media | Corregido |
| AUD-08 | Encabezados de página | La pestaña activa sobre la franja verde era ilegible | Media | Corregido |
| AUD-09 | Historial, Proveedores, Usuarios | Desborde horizontal en móvil (375 px) | Media | Corregido |
| AUD-10 | Inicio (caja y bodega) | La lista de pendientes aparecía dos veces e `id` duplicado | Media | Corregido |
| AUD-11 | Inicio (caja) | "Hoy en caja" repetía los indicadores de contado y crédito | Baja | Corregido |
| AUD-12 | Inicio (bodega) | El subtítulo llamaba "por vencer" a lotes ya vencidos | Media | Corregido |
| AUD-13 | Inicio (bodega) | "Quedan 4 unidades" de un producto con todo vencido | Baja | Corregido |
| AUD-14 | Lotes | La cifra de vencidos aparecía cuatro veces en la pantalla | Baja | Corregido |
| AUD-15 | Finanzas | Componente de pestañas propio, distinto del kit y con poco contraste | Baja | Corregido |
| AUD-16 | Usuarios / Mi perfil | Dos implementaciones y tres entradas para "Cambiar mi contraseña" | Baja | Corregido |
| AUD-17 | Mi perfil | "Solo lo cambia el administrador" para una función que no existe | Media | Corregido (texto); capacidad en P-01 |
| AUD-18 | Kit › Modal | Los diálogos no gestionaban el foco | Media | Corregido |
| AUD-19 | Barra superior › Más | `role="menu"` sin elementos de menú ni manejo de teclado | Baja | Corregido |
| AUD-20 | Inicio | El abanico decorativo tapaba saludos largos | Baja | Corregido |
| AUD-21 | Inicio | La tarjeta de estado repetía el saludo al cargar y nombraba tareas ajenas al rol | Baja | Corregido |
| AUD-22 | Kit › Estados | El texto de carga usaba mayúsculas espaciadas en mono (contra la regla 2) | Baja | Corregido |
| AUD-23 | Código | Componentes y funciones sin uso; constante `LOW_STOCK` duplicada | Baja | Corregido |
| AUD-24 | Inicio en móvil | Hueco vacío en el encabezado sin el abanico | Baja | Corregido |
| P-01 a P-08 | Varios | Ver [07-pendientes.md](07-pendientes.md) | — | Pendiente |

## Detalle

### AUD-01 · "Hoy" y los cortes por fecha se calculaban en UTC — Alta

- **Evidencia.**
  - La sesión de PostgreSQL estaba en `UTC` (`show timezone` → `UTC`), así que `('2026-10-17T01:30:00Z'::timestamptz)::date` daba `2026-10-17`.
  - En la API, `todayIso()` era `new Date().toISOString().slice(0, 10)`; en la app, el mismo patrón en `src/lib/format.ts`.
- **Impacto.**
  - Desde las 7:00 p. m. hora de Colombia, una venta quedaba en el día siguiente en reportes, historial y gráficos.
  - Los atajos "Hoy" de la app pedían el día de mañana.
  - FEFO daba por vencido, a partir de las 7 p. m., un lote que vence ese mismo día.
  - El inventario y los vencimientos se calculaban con la fecha de mañana.
- **Causa.** Se asumía que el servidor y la base trabajan en hora local.
- **Solución.**
  - API:
    - `BUSINESS_TZ`, por defecto `America/Bogota`.
    - `todayIso()` ahora formatea en esa zona.
    - Cada conexión del pool abre con `-c TimeZone=<zona>`, así que `::date` y `CURRENT_DATE` cuentan en hora local.
  - App: `todayIso()` usa la fecha local del equipo.
- **Riesgo del cambio.** Bajo. Las ventas ya guardadas no cambian (`created_at` es `timestamptz`); solo se agrupan bien. Un Postgres detrás de un *pooler* que no acepte `options` necesitaría fijar la zona en el rol de la base (anotado en pendientes).
- **Verificación.**
  - Prueba `AUD-01` en `tests/auditoria.test.ts` (20:30 del 16 en Bogotá → `2026-10-16`).
  - Consulta real con el pool de la API: `TimeZone = America/Bogota` y `::date = 2026-10-16`.

### AUD-02 · El punto de venta ofrecía unidades vencidas — Alta

- **Evidencia.**
  - "Leche entera 1L" tiene `stock = 4`, pero sus dos lotes con existencias vencieron el 19/09/2026.
  - El punto de venta mostraba "4 Disponible" y dejaba agregarla.
  - Al confirmar, la API respondió `409 / 620`: "No hay stock suficiente. Disponible: 0" (captura en el recorrido de caja).
- **Impacto.** La caja arma una venta que el sistema no puede registrar. El mensaje contradice la columna "Disponible" de la misma pantalla.
- **Causa.**
  - `products.stock` suma también los lotes vencidos, que FEFO nunca descuenta.
  - El cliente usaba ese número como disponible.
- **Solución.**
  - La API agrega a cada producto `availableStock`: unidades de lotes no vencidos. Es un campo nuevo; no quita ni cambia nada del contrato.
  - El punto de venta usa ese valor para la columna, el tope del carrito y el botón, y muestra la etiqueta "N vencidas".
- **Verificación.**
  - `GET /products` → `LEC-001 stock 4, availableStock 0`.
  - En pantalla: "0 · sin stock · 4 vencidas" y "Agregar" deshabilitado.

### AUD-03 · La API aceptaba lotes ya vencidos — Alta

- **Evidencia.**
  - `POST /products/2/batches {"quantity":1,"expiresAt":"2020-01-01"}` respondió `201`.
  - El stock subió con una unidad que no se puede vender. El lote de prueba se retiró después con una transacción en la base local.
  - En la app, el formulario de compra (`PurchaseModal`) tenía `min=hoy`, pero el de lote (`BatchForm`) no.
- **Impacto.** El stock se infla con mercancía invendible y el valor del inventario queda mal.
- **Solución.**
  - `registerBatch` responde `400` en `expiresAt` cuando la fecha es anterior a hoy, en hora del negocio. Cubre lote y compra a proveedor.
  - `BatchForm` tiene `min` y la misma regla en el cliente.
- **Verificación.**
  - Prueba `AUD-03`.
  - Llamada real → `400 {"path":"expiresAt","message":"El lote ya está vencido; no puede ingresar a bodega"}`.
  - El campo de fecha del modal tiene `min="2026-10-16"`.

### AUD-04 · Rango de fechas invertido en el reporte de ventas — Media

- **Evidencia.** `GET /reports/sales?from=2026-10-20&to=2026-10-01` respondía `200` con todo en cero.
- **Impacto.** Un reporte vacío parece "no hubo ventas" en vez de "el rango está mal".
- **Solución.** `400` con `path: "from"`. La app ya impedía el caso con `min`/`max` en los campos.
- **Verificación.** Prueba `AUD-04` y llamada real → `400`.

### AUD-05 · Unidades vencidas como existencias normales en Inventario — Media

- **Evidencia.** La tarjeta de Leche decía "Bajo · 4 u."; la tabla, "Stock 4".
- **Solución.**
  - Estado "Vencido" cuando todo lo que queda está vencido.
  - Texto "4 u. · 4 vencidas" en la tarjeta y "4 (4 vencidas)" en la tabla.
  - El stock físico se sigue mostrando, porque bodega necesita saber qué retirar.
- **Verificación.** Captura de Inventario como administración.

### AUD-06 · Actividad reciente con solo la hora — Media

- **Evidencia.**
  - El Inicio de administración mostraba "Ventas del mes $0" y, al lado, "Consumidor final · 03:10 p. m. · +$2.500".
  - Esa venta es del 22/09.
- **Impacto.** Parece que hubo ventas hoy que el indicador no cuenta.
- **Solución.** `whenShort()`: solo la hora si fue hoy; si no, "22 sep · 03:10 p. m.".

### AUD-07 · Módulo con candado invisible — Media

- **Evidencia.**
  - Para caja, el círculo de "Finanzas y crédito" se veía vacío: el ícono iba en `--muted-2` sobre el verde.
  - El `aria-label` no decía que el acceso estaba restringido.
- **Solución.**
  - Ícono en `--on-band-muted`, borde punteado y sello blanco con candado.
  - `aria-label` "Finanzas y crédito (acceso restringido)".
- **Verificación.** Captura de la barra como caja.

### AUD-08 · Pestaña activa ilegible sobre la franja — Media

- **Evidencia.**
  - En Ventas, "Punto de venta" activo tenía color `rgb(255,255,255)` sobre la píldora blanca.
  - Causa: `.pageActions` redefine `--ink` y `--surface` para los botones, y `Tabs` hereda esas variables.
- **Solución.** `.pageActions [role="tablist"]` devuelve a las pestañas sus propias variables: píldora activa blanca con texto `--forest` y el resto en blanco.
- **Verificación.** Medición del color calculado y captura.

### AUD-09 · Desborde horizontal en móvil — Media

- **Evidencia.** Con 375 px de ancho:
  - `/ventas/historial` desbordaba 187 px.
  - `/proveedores`, 241 px.
  - `/usuarios`, 32 px.
- **Causa.**
  - Textos solo para lectores de pantalla (`position: absolute`) dentro de contenedores con `overflow-x: auto` sin `position: relative`.
  - En el historial, los filtros con `min-width: 120px` dentro de una fila que no se encogía.
- **Solución.**
  - `position: relative` en `DataTable .wrap` y `AccessMatrix .scroller`.
  - Bajo 720 px, la fila de filtros ocupa el ancho completo con `min-width: 0`.
- **Verificación.** Nuevo recorrido: 0 px de desborde en las 17 rutas para los tres roles.

### AUD-10 · Pendientes duplicados en el Inicio de caja y de bodega — Media

- **Evidencia.**
  - En caja, la tarjeta destacada (`StatusAside`) y "Pendientes de hoy" pintaban `pendingItems(customers)` con los mismos datos.
  - En bodega, la tarjeta destacada y "Qué hacer hoy" pintaban `todoItems(...)`.
  - Las dos tarjetas usaban `id="pendientes"`.
- **Solución.**
  - Se quitó la tarjeta repetida; la destacada conserva la lista, el total y el enlace "Ver detalle".
  - Se eliminó `scrollToPending` (sin uso) y el `id` duplicado.

### AUD-11 · "Hoy en caja" repetía indicadores — Baja

- **Evidencia.** El donut mostraba contado y crédito de hoy, ya presentes en los indicadores "Contado hoy" y "Crédito hoy" de la misma pantalla.
- **Solución.** Se quitó. "Últimas ventas" ocupa su lugar en la rejilla, así que el Inicio de caja cabe en una sola fila de tarjetas.

### AUD-12 · Subtítulo de bodega contradictorio — Media

- **Evidencia.** Decía "2 lotes por vencer en 30 días", mientras el indicador "Lotes por vencer" marcaba 0 y "Lotes vencidos" 2.
- **Causa.** `GET /batches/expiring` incluye los vencidos y el subtítulo usaba `count`.
- **Solución.**
  - El subtítulo ahora dice "0 lotes por vencer en 30 días · 2 vencidos".
  - La tabla pasa a llamarse "Lotes por orden de vencimiento · Vencidos y próximos a vencer".

### AUD-13 · "Quedan 4 unidades" de un producto vencido — Baja

- **Solución.**
  - Los pendientes de bodega cuentan unidades vendibles.
  - Si todo está vencido: "Todo lo que queda de Leche entera 1L está vencido · Reponer".

### AUD-14 · Cifra de vencidos repetida en Lotes — Baja

- **Evidencia.** El "2 vencidos" aparecía en cuatro lugares de la misma pantalla:
  - el aviso;
  - el indicador;
  - la leyenda del estante;
  - la tarjeta "Distribución".
- **Solución.**
  - Se quitó "Distribución": sus mosaicos repetían los indicadores y la leyenda.
  - Su nota sobre FEFO pasó al pie de la tabla.

### AUD-15 · Pestañas propias en Finanzas — Baja

- **Evidencia.** `FinanceTabs` era una copia de `Tabs` con estilo subrayado (su comentario decía "mismo aspecto que Tabs", ya no era cierto). Los rótulos inactivos iban en gris sobre verde.
- **Solución.** Finanzas usa `Tabs` del kit, que ahora acepta `ariaLabel` y desplaza la pestaña activa a la vista. Se borró `FinanceTabs`.

### AUD-16 · Cambio de contraseña duplicado — Baja

- **Evidencia.**
  - `ChangePasswordModal`, en Usuarios, se abría desde el encabezado y desde la tarjeta propia.
  - `PasswordForm`, en Mi perfil › Seguridad, hacía lo mismo con la misma validación.
- **Solución.**
  - Queda solo Mi perfil › Seguridad.
  - La tarjeta propia en Usuarios lleva allí.
  - Se quitó el botón del encabezado y se borró el modal.

### AUD-17 · Texto engañoso en Mi perfil — Media

- **Evidencia.**
  - "Usuario" y "Rol" decían "Solo lo cambia el administrador".
  - La API no tiene `PUT /users/:id` y la pantalla de Usuarios no ofrece editar.
- **Solución.** El texto pasa a "Se fija al crear la cuenta; no se modifica desde el sistema". La falta de la capacidad se registra en P-01.

### AUD-18 · Diálogos sin gestión de foco — Media

- **Evidencia.** Al cerrar con Escape, el foco quedaba en `<body>`. Tab podía salir del diálogo hacia la página de atrás.
- **Solución.**
  - Al abrir, el foco entra al diálogo.
  - Tab y Shift+Tab dan la vuelta dentro.
  - Al cerrar, el foco vuelve al control que lo abrió (se toma antes de que un campo con `autoFocus` se lo lleve).
- **Verificación.** En el navegador, con "Registrar lote":
  - foco dentro al abrir;
  - Shift+Tab ×2 sigue dentro;
  - Escape cierra y el foco vuelve al botón.

### AUD-19 · `role="menu"` en "Más" — Baja

- **Solución.** El menú "Más" es una lista de enlaces que se despliega, así que se quitó el rol `menu`; mantiene `aria-expanded` en el botón.

### AUD-20 · El abanico tapaba el saludo — Baja

- **Evidencia.** "Buenas tardes, Bodega." terminaba en x = 840 px y el abanico empezaba en x = 775 px.
- **Solución.** Con el abanico visible, el texto se limita a `calc(61% - 250px)`: un saludo largo baja de línea.

### AUD-21 · Tarjeta de estado — Baja

- **Evidencia.**
  - Mientras cargaba, la tarjeta repetía el saludo del encabezado.
  - Para caja decía que mostraría "lotes por vencer y existencias bajas", que no son tareas de caja.
- **Solución.**
  - Título de carga neutro.
  - Nueva propiedad `watches`, con el texto de cada rol.

### AUD-22 · Texto de carga en mayúsculas espaciadas — Baja

- **Solución.** `States.module.css › .loadText`: Urbanist 13 px, sin mayúsculas, sin `--font-mono`.

### AUD-23 · Código sin uso y duplicado — Baja

- **Evidencia.** Un barrido de importaciones encontró `screens/Home/AttentionCard.tsx` sin ningún uso.
- **Además, sin uso tras la simplificación:**
  - el componente `AttentionList`, que solo aportaba un tipo;
  - `scrollToPending`;
  - `DistributionCard`;
  - `.gridEven`.
- **Duplicado:** `LOW_STOCK = 5` estaba definido en `Home/attention.ts` y en `Inventory/stockStatus.ts`.
- **Solución.**
  - Se borraron los archivos y las reglas.
  - El tipo `AttentionItem` pasó a `attention.ts`.
  - `LOW_STOCK` quedó solo en `stockStatus.ts`.

### AUD-24 · Hueco en el encabezado móvil — Baja

- **Solución.** Bajo 1100 px, sin el abanico, `HeroHeader` deja de reservar 270 px de alto.

## Verificado sin hallazgo

- **Permisos.** La matriz de permisos de la API coincide con lo que muestra cada rol: 18 lecturas y 8 escrituras probadas con las tres cuentas (ver [06-pruebas-verificacion.md](06-pruebas-verificacion.md)).
  - Las pantallas fuera del rol muestran "no está disponible para su cuenta".
  - Ninguna pantalla pide un recurso que su rol no puede leer: 0 respuestas 4xx/5xx en el recorrido.
- **Reglas de negocio.** Responden con el código esperado:
  - stock insuficiente (`409/620`);
  - crédito sin cliente (`400`);
  - venta sobre el cupo (`409/621`);
  - abono mayor que el saldo (`409/623`);
  - abono negativo (`400`);
  - anulación por caja (`403/613`).
- **Auditoría.** Solo registra escrituras exitosas; las sondas fallidas (400/403) no dejaron rastro.
