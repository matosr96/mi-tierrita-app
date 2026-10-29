# Mi Tierrita App — guía para sesiones de trabajo

SPA de Mi Tierrita SIG (React 19 + TypeScript + Vite, TanStack Query, Zustand, React Router 7, Axios,
CSS modules con variables de tema). Consume la API de `../mi-tierrita-api` (`VITE_API_URL`, por defecto
`http://localhost:4300/api/v1`). La estructura de pantallas sale de los documentos 02 (arquitectura), 07 (diseño) y 09
(infraestructura) del TCC; el estilo visual ya no calca el lienzo original sino la dirección cinematográfica
descrita en la regla 2.

## Comandos

`pnpm dev` (puerto 5173) · `pnpm typecheck` · `pnpm build` · `pnpm preview`.

## Cadena de datos en un solo sentido

`pantalla → hook de la entidad → servicio HTTP → API`. Una pantalla nunca importa un servicio ni el cliente
HTTP; solo usa hooks. Un hook por operación (`src/hooks/<entidad>/useX.ts`), un servicio por recurso
(`src/services/<recurso>.ts`), tipos de la API en `src/types/api.ts`, estado global en `src/stores/`.

## Reglas de oro

1. **Toda pantalla contempla sus tres estados**: cargando, vacío (con llamada a la acción) y con datos.
   Usar `QueryState` / `Loading` / `EmptyState` / `ErrorState` de `@/components/ui`.
2. **Ningún color suelto**: solo variables de `src/styles/theme.css`. Dirección visual inspirada en las referencias
   **Clerio CRM** y **Pay Key** (Behance, octubre de 2026), en verde pastel de la marca: tema claro predeterminado y modo oscuro opcional (Mi perfil → Apariencia; `lib/theme.ts` pone `html[data-theme]` y `theme.css` solo redefine variables: ninguna pantalla conoce el tema); sin menú
   lateral (navegación superior en píldora con íconos, secundarias en "Más", menú desplegable en pantallas angostas);
   encabezado y barra sobre un degradado `--hero-from` → `--hero-to`; tarjetas `--surface` sin borde, radio `--radius`
   22 px y sombra `--shadow`; botones, pestañas y filtros en píldora; acento `--sprout` (verde) con `--sprout-soft`;
   semánticos `--good`/`--warn`/`--bad` con `-soft`, `-line`, `-tag-bg`, `-tag-fg`. Tipografía Urbanist en todo:
   titulares y cifras grandes en peso 400–500 con tracking negativo; `--font-mono` solo para códigos (SKU, factura,
   lote). Minigráficos de barras finas (`Sparkline`). Nada de etiquetas en mayúsculas espaciadas, texturas ni curvas de
   nivel. Contraste AA calculado para cada par de tokens (no bajar `--muted` ni aclarar `--sprout`). Movimiento **mínimo y funcional** dentro de la app: solo transiciones cortas de estado
   (`--dur`); `global.css` anula toda animación salvo en elementos con `data-motion` (indicadores de carga y la página
   pública). Los SVG de iconos pueden llevar `currentColor`.
3. **Estilos encapsulados**: cada pantalla/componente tiene su `X.module.css`; nada de CSS global nuevo.
4. **El frontend no calcula**: totales, saldos e indicadores se muestran tal como los devuelve la API.
   Lo único que suma el cliente es una vista previa del carrito, marcada como estimada.
5. **Acciones según el rol**: los controles que el rol no puede usar **no se muestran** (no solo se
   deshabilitan). El rol activo está en `useSessionStore((s) => s.user)`; la matriz de roles por endpoint
   es la del documento 06 (ver `src/router/navigation.ts` y el README de la API).
6. **Errores**: las mutaciones devuelven `ApiError { code, message, details }`; `fieldErrors(err)` da el
   mapa campo → mensaje de un 400 para pintarlo en cada `Field`. Los hooks con `notifyError: false`
   esperan que el formulario muestre el error; los demás notifican solos con un toast.
7. **Formularios**: validación mínima en cliente (obligatorios, número), el backend es la fuente de verdad.
   Después de una mutación exitosa el hook invalida las cachés; no hace falta refetch manual.
8. **Un archivo por componente/pantalla** con función flecha exportada; sin clases; `camelCase` en
   TypeScript; textos de la interfaz en español.
9. Formato de números y fechas siempre con `@/lib/format` (`money`, `moneyCompact`, `int`, `pct`,
   `num2`, `years`, `times`, `dateOnly`, `dateTime`, `monthYear`, `dayLong`, `dayHeading`).

## Kit disponible (`@/components/ui`)

`Button` (variant primary|secondary|ghost|danger|accent, size sm|md|lg, block, loading) · `Field`, `Input`,
`Select`, `FieldRow`, `Checkbox` · `Card` (title, subtitle, actions, flush) · `StatCard` (label, value,
hint, tone neutral|good|warn|bad) y `StatGrid` · `Badge` (tone) · `DataTable<T>` (columns[{key, header,
label?, align, render, width}], rows, rowKey, onRowClick, footer, scroll?; bajo 640 px se apila: cada fila es una tarjeta y cada
`<td>` lleva `data-label` con el `header` —o `label` si el encabezado no es texto— que se pinta antes del valor; la
cabecera queda solo para lectores y los totales de `footer` se apilan rotulados por columna; `scroll` conserva el
desplazamiento horizontal: lo usan las tablas de reportes y la hoja de Finanzas) · `ViewSwitch` (value, onChange, modes?
subconjunto de cards|list|table, ariaLabel; píldora Tarjetas/Lista/Tabla con iconos, `role="radiogroup"`, flechas) y
`useViewMode(key, allowed, fallback)` (preferencia en `localStorage` `mi-tierrita:<key>-vista`, funciones puras
`readViewMode`/`writeViewMode` de `viewMode.ts`; «mosaic» se lee como `cards`). Inventario (tabla por defecto), Clientes
(lista) y Proveedores (tabla) ofrecen los tres modos · `Loading`, `EmptyState`, `ErrorState`,
`QueryState` · `Pagination` (page, onPage) · `Modal` (open, title, description, onClose, footer, wide) ·
`PersonPopover` + `PersonName` (`@/components/people`; ficha de persona: `openPersonCard(userId, el)` desde cualquier avatar o nombre; montada una vez en `AppShell`) · `useModalOpenFlag(open)` (marca `body[data-modal-open]` para que el orbe de Tita se aparte; lo usan `Modal` y los diálogos propios) · `Tabs` (control segmentado en píldora; `ariaLabel` opcional; también sobre la franja verde) y `Chips` (píldoras; activa verde suave) · `MiniCalendar` (value `YYYY-MM-DD` | null, onChange, max; rejilla de un mes lunes a domingo, mes anterior/siguiente, teclado con flechas, `aria-label` por día) · `Callout` (veredicto: tone good|warn|bad con
ícono, título 20 px, aside a la derecha) · `Toasts` · `DocumentViewer` (vista previa a pantalla casi completa: `open`, `name`, `mime`,
`src` Blob | URL | null, `size?`, `error?`, `onClose`, `onDownload?`, y `items` + `index` + `onNavigate` para anterior/siguiente;
imágenes con zoom y arrastre, PDF en `<iframe>` sobre `blob:` con «Abrir en pestaña nueva» si el navegador no lo incrusta,
texto y CSV en `<pre>`/tabla, el resto solo ficha y «Descargar»; exporta `sizeLabel` y `viewerKind`) · `UserAvatar`
({ user: {id, firstName, lastName, hasAvatar?, avatarUpdatedAt?}, size, className? }: la foto por `GET /users/:id/avatar`
descargada con la sesión y en caché por `avatarUpdatedAt`, o las iniciales con el estilo del contenedor). `DataTable` alinea el texto a la izquierda; las columnas
numéricas declaran `align: "right"`. En `@/components/layout`: `PageHeader` (título, subtítulo y acciones; sin
decoración), `HeroHeader` (encabezado del Inicio: eyebrow, titular, subtítulo, acciones y `aside` con los pendientes),
`BrandMark` (de `AppShell`), `CommandPalette` (⌘K / Ctrl+K) y `NotificationsMenu`. `AppShell` pone en la píldora
las rutas de `PRIMARY` (rótulos cortos) y el resto, más "Cerrar sesión", en "Más". El Inicio usa la rejilla `.dash`
de tres columnas, la tarjeta destacada `StatusAside` (degradado verde con los pendientes; `watches` dice qué vigila para el rol) y `ActivityCard`. Cada pendiente aparece una sola vez en el Inicio (la campana y las insignias lo repiten fuera de él, a propósito). La portada de Inicio responde
"¿está todo bien?": `statusTitle` + `StatusAside` a partir de los pendientes de `screens/Home/attention.ts`.
Ya no existe `@/components/motion`: dentro de la app no hay titulares animados, odómetros, fondos WebGL ni efectos de
scroll (la página pública es la única excepción).
Gráficos SVG en `@/components/charts`: `HBarChart`, `VBarChart` ({label, value, alt}[], format; `alt` pinta la barra
en naranja), `DonutChart` (data[{label, value, tone}], format, center, centerLabel; valor al pasar el cursor por el tramo
o la leyenda), `Sparkline` (values, labels?, format?; también vía `StatCard trend`; valor al pasar el cursor),
`LineChart` (points, formatX, formatY, marker, highlightX), `TornadoChart` (data[{label, low, high}], base, format),
`StackedBarChart` (data[{label, values}], series[{key, label, tone}], format, onSelect(i); leyenda clicable con
`aria-pressed` que oculta series; ← → entre barras), `HeatmapCalendar` (data[{date, value}], from, to, format, onSelect(date);
semanas × días en cinco tonos de `--sprout` con `color-mix`; flechas entre días), `RankingChart` (data[{label, value,
tone, hint}], format, onSelect(i); «1.», «2.»…), `Legend` (compartida; `onToggle` la hace clicable) y `ChartDetailModal`
(tabla `DataTable` con las filas de la gráfica tocada y «Descargar Excel» vía `downloadXlsx`). Todas con hover y teclado
por `useChartHover`/`ChartFrame` (Enter o espacio abre el detalle) y se imprimen con sus colores. Tonos: accent, soft,
forest, good, warn, bad, muted.
Comentarios e historial por registro (brief 33): `CommentsPanel` (`@/components/comments`; props `entity` products|customers|sales|suppliers|batches
y `entityId`; lista cronológica, «Responder» cita el comentario encima del cuadro como en el chat, eliminar el propio —ADMIN cualquiera—;
hooks `useComments`, `useCreateComment`, `useDeleteComment`) y `RecordHistory` (`@/components/audits`; línea de tiempo de
`GET /audits/entity/:entity/:id` con quién, cuándo y `changes`; se pinta solo para ADMIN; `useRecordHistory`). Van como pestañas
«Comentarios» e «Historial» en `ProductBatchesModal`, `CustomerDetailModal` y `SaleDetailModal`. La paleta ⌘K busca además en
`GET /search` (`useGlobalSearch`, rebote de 250 ms en el componente): producto → `/inventario?buscar=<sku>`, cliente → `/clientes?c=<id>`,
persona → `/chat?con=<id>`, proveedor → `/proveedores`.
Calendario reutilizable (brief 31): `Calendar` (`@/components/calendar`; props `initialView?` month|agenda y `days?`: con `days` pide de hoy a
hoy + days − 1 y muestra solo la agenda, sin meses ni filtros) con `Tabs` Mes/Agenda, `Chips` por prioridad y por área, resumen de `summary`,
mes anterior/siguiente/«Hoy»; `CalendarMonth` (rejilla lunes a domingo con píldoras —puntos bajo 720 px—, `aria-label` completo por día,
flechas entre días que cruzan de mes, lista del día tocado debajo), `CalendarAgenda` y `calendarGroups.ts` (`groupByDay`, `monthGrid(año, mes 1–12)`).
Tocar un ítem navega a su `href`.

## Exportes, notificaciones y perfil

- **PDF**: `printElement(el | [portada, hoja], nombre)` de `@/lib/print` copia el documento a `#print-root` (quita el
  `hidden` de las copias) y abre el diálogo de impresión (allí se elige «Guardar como PDF» y la carpeta; el botón lo dice
  en su `title`); las reglas `@media print` están en `global.css`: `@page` con «Página X de Y» en el margen inferior
  (cajas de margen, Chrome 131+), `thead` repetido por página, `tr` y `[data-print-block]` sin partir, `[data-print-cover]`
  con salto de página. Los reportes imprimen portada + `ReportPaper`; Finanzas imprime una hoja oculta del proyecto
  (`SimulatorReport`, seis secciones en el orden de las pestañas, con folio).
- **Flujo del PDF de un reporte** (`ReportPreview`): primero registra el documento con `useRecordExport` (`filters` y
  `summary` estructurados) y la API devuelve `folio` `R-AAAA-NNNNNN`, `hash` y `verifyUrl`; luego monta la portada
  `ReportCoverPage` (foto de `public/media` con crédito, marca, título, período y filtros, quién y cuándo, folio y
  `QrCode` con `${origin}/verificar/${folio}`) en un contenedor `hidden` y la imprime junto con la hoja. El folio llega
  al pie de `ReportPaper` por `ReportStampContext`. Si el registro falla, se imprime sin folio ni QR y se avisa.
  `ReportPicker` es la tarjeta para elegir reporte (no es la portada).
- **QR**: `@/lib/qr` (`encodeQr(texto)` → matriz; modo byte, versión 1–10, corrección M, máscara por penalización, sin
  dependencias) y `QrCode` de `@/components/ui` (SVG con `fill="currentColor"`).
- **Verificación pública** `/verificar/:folio` (`screens/Verify`, `lazy`, fuera de `RequireSession`): `useVerifyExport`
  → `GET /reports/verify/:folio` y muestra «Documento auténtico» con emisión, filtros y cifras, o «No encontrado».
- **Excel**: `downloadXlsx(nombre, hojas)` de `@/lib/xlsx` arma un .xlsx real sin dependencias (encabezado del
  documento con los KPI en las primeras filas, formatos `int`/`money`/`pct`/`decimal`, fila de totales, encabezado
  congelado y repetido al imprimir con `_xlnm.Print_Titles`). Solo serializa lo que devolvió la API. Guarda con
  `saveBlob`: «Guardar como» con `showSaveFilePicker` si existe (cancelar no es error: resuelve `false` y no se registra)
  y `<a download>` si no.
- **Trazabilidad**: las tablas del documento llevan la columna «Origen» (`SourceCell`: «Ventas #12, #15, +3» con los
  `sourceIds`/`sourceCount` de la API; en inventario `productIds`; en cartera el `customerId`) y al tocar la fila se
  navega al registro: `/ventas/historial?sale=&from=&to=`, `/clientes?c=`, `/inventario?categoria=` (las tres
  pantallas leen el parámetro al montar). Cada bloque conserva su nota «Fuente: …».
- **Notificaciones**: la campana (`NotificationsMenu`) muestra los pendientes del Inicio de cada rol
  (`useNotifications`, misma caché que el Inicio); lo leído se guarda en `useNotificationsStore` (este navegador).
- **Mi perfil** (`/perfil`, `/perfil/seguridad`, `/perfil/actividad`): cualquier rol, fuera del menú; se abre desde el
  usuario de la barra superior o con ⌘K. Nombre, correo y teléfono se editan con `useUpdateProfile` (`PUT /users/me`,
  solo los campos cambiados, a partir de `useMe`); la contraseña con `useChangePassword`; "Mi actividad" usa la
  auditoría (administrador) o las ventas propias (secretaria). **Foto de perfil** (`AvatarEditor`, junto al nombre):
  «Cambiar/Subir foto» reduce la imagen a 256×256 con `avatarImage` de `lib/attachments.ts` y la sube con
  `useUpdateAvatar` (`PUT /users/me/avatar`, binario); «Quitar foto» con `useRemoveAvatar`. Ambos refrescan el usuario
  de la sesión; la barra (`AppShell`, con `useMe`) y `PersonCard` la muestran con `UserAvatar`.
- **Biblioteca** (`/biblioteca`, grupo «Gestión», todos los roles): documentos (archivo en la base, mismos tipos que los
  adjuntos del chat salvo audio) y enlaces, cada uno con los roles que lo ven (vacío = todos; la API ya filtra).
  `screens/Library/`: `LibraryScreen` (filtros Todo/Documentos/Enlaces, búsqueda con espera de 300 ms, rejilla de
  `LibraryItemCard`), `LibraryFormModal` (enlace o documento con arrastrar/soltar y barra de progreso; editar título,
  descripción, roles y la dirección de un enlace). «Ver» abre el `DocumentViewer` con el blob de `useLibraryFile` (anterior
  /siguiente entre los documentos de la página); un enlace se abre en pestaña nueva con `rel="noopener noreferrer"`.
  Solo ADMIN ve «Agregar», «Editar» y «Eliminar» (con confirmación).
- **Calendario** (`/calendario`, grupo «Operación», todos los roles; `screens/Calendar/CalendarScreen`): `PageHeader` con lo que ve el rol
  y el `Calendar` (`GET /calendar`: lotes para ADMIN y bodega, cobros para ADMIN y secretaria, alarmas propias y cierres de mes). El Inicio
  de administración lo repite en la tarjeta «Esta semana» (`<Calendar days={7} />`).
- **Pedidos** (`/pedidos`, grupo «Operación», todos los roles; `screens/Orders/`): `OrdersScreen` (pestañas «A proveedores» —ADMIN y bodega— y «De clientes» —ADMIN y secretaria—, solo las del rol; conteos Abiertos/Vencidos/Próximos, filtro por estado, búsqueda y `ViewSwitch` Lista/Tabla; `?tipo=proveedor|cliente`, `?pedido=<id>` abre el detalle y `&venta=<id>` abre «Marcar entregado» con esa venta), `OrderList`/`OrderTable` (vencidos en `--bad` y a 2 días en `--warn` según `overdue`/`daysToDue` de la API), `OrderFormModal` (contraparte, líneas con precio sugerido y total «estimado»), `OrderDetailModal` (líneas y total de la API; recibir, editar si está pendiente, «Registrar la venta» → `handOff` tipo `sale` con `orderId` al punto de venta —no se marca como IA y al confirmar ofrece «Volver al pedido»—, «Marcar entregado» con `DeliverOrderPanel`, cancelar con confirmación) y `ReceiveOrderModal` (cantidad, costo real y vencimiento por línea; parcial permitido); hooks `@/hooks/orders`.
- **Conteos de inventario** (`/conteos`, grupo «Operación», ADMIN y bodega; `screens/StockCounts/`): `StockCountsScreen` (filtro por estado y `?c=<id>` abre la hoja), `CountList` (por estado; atrasados en `--bad` y de hoy en `--warn` según `due` de la API), `CountFormModal` (programar o editar), `CountSheet` (un renglón por producto con cuadro numérico grande, Enter pasa al siguiente, diferencia que devuelve la API al guardar, barra pegada abajo con «Guardar avance» y «Enviar») y `AdjustmentPreviewModal` (solo ADMIN: faltantes con sus lotes y sobrantes con fecha de vencimiento, «Aplicar ajuste» con confirmación); hooks `@/hooks/stock-counts`.
- **Nómina** (`/nomina`, grupo «Gestión», solo ADMIN; `screens/Payroll/`): `PayrollScreen` (pestañas Periodos/Empleados con `?pestana=empleados`; `?periodo=<id>` abre el detalle, para enlazar desde el calendario y los avisos), `PayrollNotice` (liquidación simplificada: no reemplaza la nómina electrónica de la DIAN ni calcula prestaciones ni aportes del empleador), `PeriodList`, `PeriodFormModal`, `PeriodDetail` (líneas en `DataTable` con `LineAmountInput` para horas extra, bonificaciones, auxilio de transporte —del decreto vigente, por defecto 0— y otros descuentos solo en borrador; la API recalcula salud y pensión 4 % y los totales; «Aprobar», «Marcar pagado» y «Eliminar borrador» con confirmación; «Exportar a Excel» con `downloadXlsx`), `EmployeeList` y `EmployeeFormModal`; hooks `@/hooks/payroll`.
- **Historial de reportes**: cada PDF o Excel generado se registra con `useRecordExport` (`ReportPreview` lo hace
  solo si recibe `record`, con `filters` y `summary`; Finanzas desde `SimulatorReport`) y se lista en `ExportHistory`
  (prototipo 09): fecha y hora, reporte con los filtros en texto legible, formato, quién, folio y botón «Verificar»
  que abre `/verificar/:folio`.
- **Comunicación**: `/chat` (todos los roles; `?con=<id>` privado, `&hilo=<id>` hilo abierto, `&m=<id>` mensaje a mostrar).
  **En vivo**: `useChatRealtime` (montado una vez en `AppShell`) abre `GET /chat/stream` con `openChatStream` (SSE por
  `fetch`, reconecta solo), refresca `useChatTeam`, reparte los avisos con `onChatEvent` (`stores/chatLive`, que también
  guarda qué conversación se está viendo) y avisa de lo nuevo: aviso breve dentro de la app o notificación del navegador
  con la pestaña en segundo plano (permiso con "Activar avisos del navegador"). Sin conexión en vivo, consulta cada 6 s.
  `useChatMessages({ peerId, threadRootId }, { active, around })` lleva una conversación o un hilo: historial hacia atrás,
  saltar a un mensaje, envío optimista con `clientId` (sin conexión queda "en espera" y se reenvía solo al volver la red,
  al reconectar el aviso en vivo o cada 15 s, sin duplicar; si el servidor lo rechaza: "No se envió · Reintentar"),
  `replace(m)` para aplicar al instante un mensaje editado o eliminado, y marca como
  visto solo con la conversación a la vista y la ventana al frente. Pantalla en `screens/Chat/` (un componente por
  archivo): `ConversationList` (bandeja + búsqueda en todos los mensajes), `MessageList` (abre siempre en el último
  mensaje con el separador "Mensajes nuevos" arriba; chip flotante del día mientras se desplaza; botón "Ir al más
  reciente") / `MessageItem` (chulitos `Ticks`: reloj, enviado, entregado a todos, visto por todos en `--sprout`; en
  notas de voz, micrófono junto a los tics que pasa a `--sprout` con el estado `played` = todos la reprodujeron; tocar la
  burbuja de un mensaje propio abre su detalle; cita; menciones; adjuntos; resumen del hilo; acciones responder, hilo,
  responder por privado, fijar, información, editar en línea, eliminar con confirmación, copiar; "editado" y "Se eliminó
  este mensaje"), `Composer` (cita, adjuntos con botón/pegar/arrastrar, sugerencias al escribir "@", borrador por
  conversación; botón de micrófono que graba con `MediaRecorder` —WebM/Opus o MP4—, muestra el tiempo con
  "Detener"/"Cancelar" y al detener sube la nota con `X-Duration-Ms` y la envía sin texto; se oculta si el navegador no
  graba), `AttachmentView` (foto, ficha de archivo o `AudioPlayer`: reproductor propio con píldora reproducir/pausar, barra
  `role="slider"` y duración `m:ss`; al terminar o pasar el 90 % llama a `usePlayChatMessage` si el mensaje es ajeno),
  `ThreadPanel`, `SearchPanel` (botón "Buscar mensajes": texto y/o un día elegido con `MiniCalendar` del kit; un resultado
  lleva al mensaje con `?m=`), `PinnedBar` ("Fijado por <nombre>") / `PinsPanel` / `PinsList`, `InfoPanel` (botón "Info":
  `SidePanel` con `Tabs` Multimedia (mosaico), Archivos, Audios, Enlaces —`useChatMedia(scope, kind, page)`, `GET
  /chat/media`—, Fijados (reusa `PinsList`) y Personas con rol y "Activo ahora" / "Últ. vez hace…"), `TeamPanel` ("Activo
  ahora" / "Últ. vez hace…", `presenceLabel`/`sinceLabel` de `chatFormat.ts`), `ReceiptsModal` (pares "Entregado a / Falta
  por entregar", "Visto por / Falta por ver" y, con audio, "Reproducido por / Falta por reproducir", con `dateTime` o "aún
  no"; en vivo; solo en mensajes propios). Bajo 900 px la bandeja y la sala se turnan la pantalla completa (`roomOpen`
  en `ChatScreen`: la sala va `position: fixed; inset: 0; height: 100dvh` sobre la barra del armazón, con "Atrás" en la
  cabecera; los paneles laterales también a pantalla completa). Fijar en #general solo se ofrece a
  ADMIN; editar solo al autor; eliminar al autor y, en #general, también a ADMIN. La insignia del menú, la campana y el título de la pestaña ("(3) …") usan `unreadTotal` del equipo. Ojo: los
  hijos directos del contenido de `AppShell` llevan `position: relative`; `Modal` se pinta en un portal sobre `<body>` (capa 80, por encima de la barra, del panel de Tita y del chat móvil). Y
  `/contactos` (ADMIN; bandeja del formulario público, insignia del menú y aviso en la campana con los nuevos).
  El formulario de la página pública envía a `POST /contact` con un campo trampa `website`.

## Página pública (`src/screens/Landing`)

Ruta pública `/sitio`; `/` sin sesión también la muestra (ver `RequireSession`). Se carga en su propio paquete (`lazy`;
sin three.js ni WebGL). Mismo lenguaje visual que la app, al estilo de la landing de **Clerio** en verde pastel: blanco y
`--ground`, tarjetas blancas muy redondeadas sin borde con `--shadow`, titulares centrados en Urbanist 500 con tracking
negativo (los `*acentos*` de `SplitText` solo cambian a `--serif-color`, verde), botones en píldora. Pero **conserva sus
animaciones**: la raíz lleva `data-motion` (así `global.css` no las apaga) y los ayudantes de movimiento viven solo aquí,
en `src/screens/Landing/motion/` (`Reveal`, `SplitText`, `useInView`); la app interna no los usa. Estructura: barra
flotante en píldora (`LandingNav`: marca, secciones (incluida Tita), «Ingresar al sistema»; menú desplegable bajo 900 px) → héroe
centrado (`LandingHero` + `LandingHero.module.css`: titular, dos botones y `DashboardMock`, una pantalla del Inicio hecha
con divs a escala del Inicio real de administración (franja verde, barra alta con navegación en círculos, abanico, indicadores, línea del mes y tarjeta de pendientes) —ilustrativa, `aria-hidden`, con la leyenda "Vista ilustrativa del sistema · cifras de ejemplo"— sobre un halo
pastel; el monitor pasa de inclinado en perspectiva a plano con el scroll vía la variable `--p`, tarjetas KPI flotantes
que se mecen y una fila lenta de píldoras con las seis líneas) → catálogo (`LandingCatalog`: fotos reales
`public/media/catalogo/<código>.webp` en tarjetas blancas; al activarlas un velo blanco deja ver la escena SVG en tres
pasos de `LineStory.tsx`) → "El sistema por dentro" (`LandingSystem` + `SystemMocks`: un panel por capítulo de `CHAPTERS`
con una minipantalla que repite FEFO, venta/cupo/abono y escenarios con VPN = 0 en tres pasos mientras está a la vista;
los pasos también se eligen a mano) → "Conozca a Tita" (`LandingTita`: qué se le puede pedir y una conversación
ilustrativa en un teléfono que repite tres escenas —reponer, venta desde la foto de un pedido, pregunta por voz— con la
tarjeta que pasa a "Registrado"; mascota grande asomada en escritorio; leyenda "Conversación ilustrativa · cifras de
ejemplo") → Visítenos → Proyecto (logo de la universidad, `WORK_KIND`, `ACADEMIC`, `TEAM`) →
Contacto (`LandingContact`, `POST /contact` con campo trampa `website`) → banda de cierre (`LandingCta`, degradado pastel
con la foto de las manos) → pie claro con columnas, créditos y la palabra "Mi Tierrita" gigante recortada. Con
`prefers-reduced-motion` el monitor queda plano y los capítulos quietos en su último paso. Todo el texto sale de
`content.ts`; los datos de contacto vacíos (`STORE.whatsapp`, `email`, `hours`, `address`) ocultan su bloque: no publicar
nada sin confirmar con la tienda. Fotos y créditos en `public/media/LEEME.txt`.

## Tita, la asistente (Claude, de Anthropic)

**Tita** es la asistente de Mi Tierrita: su mascota es una plantita con carita (`components/ai/TitaAvatar`, SVG propio;
nada de destellos, estrellas, robots ni otros íconos cliché de IA). Habla cercana y directa, con trato de usted.
Principio: **las cifras salen del servidor; Tita consulta, explica y prepara; nada se registra sin que una persona lo
confirme**. Todo depende de `useAiStatus().enabled` (sin `ANTHROPIC_API_KEY` la API responde 660 y la app oculta a Tita;
las "Sugerencias de hoy" sí se muestran porque las calcula el servidor sin IA).
- **Dónde**: página `/tita` (conversación amplia, quién es, lo que puede hacer por el rol, "Para hoy") y panel rápido
  (`TitaPanel`: orbe flotante `TitaLauncher` abajo a la derecha en toda pantalla, botón "Tita" de la barra o ⌘J / Ctrl+J).
  Ambos usan `TitaConversation` y comparten la conversación (`useAiStore`); el servidor guarda el **historial** por persona
  (`useAiConversations`, modal `TitaHistory` con «Historial» y «Nueva conversación»). La imagen de Tita es el orbe 3D en CSS
  (`TitaOrb`, con `data-motion`; quieto con «reducir movimiento») con la plantita dentro.
- **Respuesta en dos pasos** (`useTitaConversation` → `askInTwoSteps`): `aiService.ask` (202 con `tareaId`) y consulta de
  `aiService.task` cada 1,5 s hasta 3 min; la pantalla actual viaja como `screen` (`screenOf`). Errores clasificados por
  `classifyError` (`lib/errors.ts`): «Sin conexión» reintenta el envío solo y sigue consultando; «Tardó demasiado» y «Error
  con código» no reintentan y muestran «Intentar de nuevo» (`retry`). Nunca se reintenta un 613.
- **Contexto de pantalla**: sugerencias por pantalla y rol en `components/ai/suggestions.ts` (`suggestionsFor`); las
  respuestas pueden traer atajos `[texto](/ruta)` que `RichText` convierte en `Link` (solo rutas internas).
- **Autocompletado** (`useTitaAutocomplete`, `POST /ai/complete` con el modelo rápido): chip bajo el cuadro tras 450 ms de
  pausa; se acepta con Tab o tocándolo.
- **@Tita** en el chat del equipo y en los comentarios: `Composer` sugiere «@Tita»; la respuesta llega como mensaje o
  comentario con `tita: true` (`MessageItem`, `CommentsPanel`), y `TitaProposalCards` muestra Confirmar/Descartar solo a
  quien la mencionó (persiste con `PATCH …/tita-actions`).
- **Manual** en `/ayuda/tita` y `/ayuda/tita/:rol` (`screens/Help/titaManual.ts`): general y por rol, enlazado desde Tita.
- **Superpoderes con confirmación**: puede hacer todo lo que la cuenta puede hacer (clientes, productos, categorías,
  proveedores, lotes, compras, ventas, abonos, anulaciones, escenarios, contactos, mensajes al equipo, reportes). El
  servidor devuelve tarjetas `AiAction` con la petición exacta; al pulsar Confirmar, `useTitaConversation().run` la envía
  con `executeAiAction` (lista cerrada de rutas en `services/ai.ts`) a la API real con `X-AI-Suggested: 1` → auditoría con
  insignia "IA", e invalida todas las cachés. Las tarjetas guardan su estado y Tita lo recibe en el historial. Venta, abono
  y compra traen además `handoff` ("Revisar en su pantalla": `peekDraft`/`clearDraft` en `PointOfSale`, `CustomersScreen`,
  `SuppliersScreen`). Los reportes llegan como `AiReportProposal` y abren `/reportes?r=…`. No crea usuarios ni maneja
  contraseñas.
- **Adjuntos** (`lib/attachments.ts`): fotos (reducidas a 1600 px), PDF (hasta 8 MB), Excel .xlsx (leído en el
  navegador sin dependencias, cada hoja a CSV), CSV y .txt; hasta 4 por pregunta.
- **Voz en vivo** (`useTitaVoice`): reconocimiento y síntesis de voz del navegador (es-CO); escucha, envía, lee la respuesta
  y vuelve a escuchar. Se oculta si el navegador no lo soporta.
- **Sugerencias de hoy** (`screens/Home/BriefingCard`, `useBriefing`): reponer, rotar lotes, cobrar, sin rotación, con su
  porqué en cifras; con IA, "Lo que sugiere Tita". En el Inicio de caja reemplaza a la lista de pendientes.
- **Borradores de texto** (`components/ai/AiDraftModal`, `useAiDraft`): mensaje de cobro, respuesta a contactos, lectura del
  reporte y explicación del escenario. **Factura por foto** (`screens/Suppliers/InvoiceImportModal`, `useReadInvoice`).
- Texto de Tita con `RichText` (párrafos, listas, citas `>` y negritas; nunca HTML).

## Simulador financiero (`/finanzas`, solo ADMIN; `screens/Finance/`)

Siete secciones en cadena más Escenarios (`SIM_TABS` en `simShared.ts`): `MarketTab`, `CompetitionTab`, `CostsTab`,
`InvestmentTab`, `FinancingTab`, `CashFlowTab`, `RisksTab` y `ProjectsTab`. `FinanceScreen` guarda solo la entrada en
edición (`SimulatorInput`); cada cambio, con 300 ms de espera, va a `useSimulation` y todo lo que se ve sale de la
respuesta de la API (una sola fuente con el informe, «Exportar» y Tita). `?proyecto=<id>` abre un proyecto; sin él se parte
del ejemplo de $94,5 M (`useSimulatorDefaults`). «Guardar proyecto» solo para el dueño (`PUT`), «Guardar como»
(`SaveAsModal`) para cualquiera. `SimField` escribe en porcentaje o puntos y envía fracciones. `SimulatorReport` arma PDF y
Excel; `ratesNote` es el párrafo de tasas de la decisión 4. Decisiones en `../DECISIONES-FASE-B.md`.

## Stock vendible y fechas

`Product.stock` es el stock físico (incluye lotes vencidos aún en bodega); `Product.availableStock` es lo que FEFO puede
vender hoy. El punto de venta usa `availableStock`; Inventario muestra el físico y marca las unidades vencidas
(`expiredUnits` de `screens/Inventory/stockStatus.ts`, donde también vive `LOW_STOCK`). `todayIso()` es la fecha local,
no UTC; la API cuenta "hoy" en `BUSINESS_TZ` (America/Bogota). Auditoría de octubre de 2026 en `docs/auditoria/`.

## Hooks disponibles (`@/hooks/<entidad>`)

- session: `useSignin`, `useSignout`, `useMe`
- users: `useUsers(query)`, `useUser(id)`, `useCreateUser`, `useChangePassword`, `useUpdateProfile`, `useUpdateAvatar` (Blob), `useRemoveAvatar`, `useUserAvatar(id, avatarUpdatedAt, {enabled})`
- library: `useLibrary({kind?, q?, page, limit})`, `useCreateLink`, `useUploadLibraryDocument` ({file, title, description?, roles?, onProgress?}), `useUpdateLibraryItem` ({id, title?, description?, url?, roles?}), `useDeleteLibraryItem` (id), `useLibraryFile(id | null, updatedAt?)`, `useDownloadLibraryFile` (item)
- categories: `useCategories(query?)`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`
- products: `useProducts(query)`, `useProduct(id)`, `useCreateProduct`, `useUpdateProduct`, `useDeactivateProduct`
- batches: `useProductBatches(productId, query?)`, `useRegisterBatch` ({productId, quantity, expiresAt, unitCost?, supplierId?}), `useExpiringBatches(query)`
- suppliers: `useSuppliers(query?)`, `useCreateSupplier`, `useUpdateSupplier`, `useRegisterPurchase` ({supplierId, productId, quantity, unitCost, expiresAt})
- customers: `useCustomers(query)`, `useCustomer(id)`, `useCustomerBalance(id)`, `useCreateCustomer`, `useUpdateCustomer`, `useRegisterPayment` ({id, amount})
- sales: `useSales(query)`, `useSale(id)`, `useRegisterSale`, `useVoidSale`
- audits: `useAudits(query)`, `useRecordHistory(entity, id, { enabled? })`
- search: `useGlobalSearch(q)` (solo consulta con 2 caracteres o más)
- calendar: `useCalendar({from?, to?})` (máximo 62 días; sin fechas = mes en curso)
- orders: `useOrders(query, {enabled?})` ({kind?, status? «PENDING,PARTIAL», from?, to?, q?, page, limit}), `useOrder(id | null)`, `useCreateOrder`, `useUpdateOrder` ({id, ...campos}), `useReceiveOrder` ({id, lines[{lineId, quantity, unitCost?, expiresAt}]}), `useDeliverOrder` ({id, saleId?}), `useCancelOrder` (id)
- comments: `useComments(entity, id)`, `useCreateComment` ({entity, entityId, body, replyToId?}), `useDeleteComment` (id)
- reports: `useSalesReport({from, to, groupBy})`, `useInventoryReport(days)`, `useReceivablesReport(overdueDays)`, `useReportExports(query)`, `useRecordExport`, `useVerifyExport(folio)` (pública)
- chat: `useChatTeam(intervalMs?)`, `useChatMessages(scope, options)`, `useChatRealtime()`, `useChatReceipts(id)`, `useChatPins(peerId)`, `usePinChatMessage` ({id, pinned}), `useChatSearch(q, scope, day?)`, `useChatMedia(scope, kind, page?, limit?)`, `usePlayChatMessage` (id), `useUploadChatAttachment` ({file, onProgress, durationMs?}), `useChatAttachment(id)`, `useDownloadChatAttachment` ({file, open?}), `useEditChatMessage` ({id, body}), `useDeleteChatMessage` (id)
- payroll: `usePayrollEmployees(query?)`, `useCreatePayrollEmployee`, `useUpdatePayrollEmployee` ({id, ...campos, active?}), `usePayrollPeriods(query?)`, `usePayrollPeriod(id | null)`, `useCreatePayrollPeriod`, `useUpdatePayrollLine` ({periodId, lineId, overtime?, bonuses?, transport?, otherDeductions?}), `useApprovePayrollPeriod`, `usePayPayrollPeriod`, `useDeletePayrollPeriod` (id)
- financial (simulador, Fase B): `useSimulatorDefaults()`, `useSimulation(input | null)` (`POST /financial/simulator/calculate`, conserva el cálculo anterior mientras llega el nuevo; error `ApiError`), `useProjects(scope "mine"|"all", query?)`, `useProject(id | null)`, `useSaveProjectAs` ({name, input}), `useSaveProject` ({id, name?, input}), `useDeleteProject` (id), `useCompareProjects(ids)`

Las consultas son `useQuery` de TanStack (data, isPending, isError, error, refetch); las mutaciones son
`useMutation` (mutate, mutateAsync, isPending, error: ApiError | null, reset).
