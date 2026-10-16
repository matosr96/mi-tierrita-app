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
   **Clerio CRM** y **Pay Key** (Behance, octubre de 2026), en verde pastel de la marca: un solo tema claro; sin menú
   lateral (navegación superior en píldora con íconos, secundarias en "Más", menú desplegable en pantallas angostas);
   encabezado y barra sobre un degradado `--hero-from` → `--hero-to`; tarjetas `--surface` sin borde, radio `--radius`
   22 px y sombra `--shadow`; botones, pestañas y filtros en píldora; acento `--sprout` (verde) con `--sprout-soft`;
   semánticos `--good`/`--warn`/`--bad` con `-soft`, `-line`, `-tag-bg`, `-tag-fg`. Tipografía Urbanist en todo:
   titulares y cifras grandes en peso 400–500 con tracking negativo; `--font-mono` solo para códigos (SKU, factura,
   lote). Minigráficos de barras finas (`Sparkline`). Nada de etiquetas en mayúsculas espaciadas, texturas, curvas de
   nivel ni superficies oscuras. Movimiento **mínimo y funcional** dentro de la app: solo transiciones cortas de estado
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
   `num2`, `years`, `times`, `dateOnly`, `dateTime`).

## Kit disponible (`@/components/ui`)

`Button` (variant primary|secondary|ghost|danger|accent, size sm|md|lg, block, loading) · `Field`, `Input`,
`Select`, `FieldRow`, `Checkbox` · `Card` (title, subtitle, actions, flush) · `StatCard` (label, value,
hint, tone neutral|good|warn|bad) y `StatGrid` · `Badge` (tone) · `DataTable<T>` (columns[{key, header,
align, render, width}], rows, rowKey, onRowClick, footer) · `Loading`, `EmptyState`, `ErrorState`,
`QueryState` · `Pagination` (page, onPage) · `Modal` (open, title, description, onClose, footer, wide) ·
`Tabs` (control segmentado en píldora; `ariaLabel` opcional; también sobre la franja verde) y `Chips` (píldoras; activa verde suave) · `Callout` (veredicto: tone good|warn|bad con
ícono, título 20 px, aside a la derecha) · `Toasts`. `DataTable` alinea el texto a la izquierda; las columnas
numéricas declaran `align: "right"`. En `@/components/layout`: `PageHeader` (título, subtítulo y acciones; sin
decoración), `HeroHeader` (encabezado del Inicio: eyebrow, titular, subtítulo, acciones y `aside` con los pendientes),
`BrandMark` (de `AppShell`), `CommandPalette` (⌘K / Ctrl+K) y `NotificationsMenu`. `AppShell` pone en la píldora
las rutas de `PRIMARY` (rótulos cortos) y el resto, más "Cerrar sesión", en "Más". El Inicio usa la rejilla `.dash`
de tres columnas, la tarjeta destacada `StatusAside` (degradado verde con los pendientes; `watches` dice qué vigila para el rol) y `ActivityCard`. Cada pendiente aparece una sola vez en el Inicio (la campana y las insignias lo repiten fuera de él, a propósito). La portada de Inicio responde
"¿está todo bien?": `statusTitle` + `StatusAside` a partir de los pendientes de `screens/Home/attention.ts`.
Ya no existe `@/components/motion`: dentro de la app no hay titulares animados, odómetros, fondos WebGL ni efectos de
scroll (la página pública es la única excepción).
Gráficos SVG en `@/components/charts`: `HBarChart`, `VBarChart` ({label, value, alt}[], format; `alt` pinta la barra
en naranja), `DonutChart` (data[{label, value, tone}], format, center, centerLabel), `Sparkline` (values; también vía
`StatCard trend`), `LineChart` (points, formatX, formatY, marker, highlightX), `TornadoChart` (data[{label, low, high}],
base, format).

## Exportes, notificaciones y perfil

- **PDF**: `printElement(el, nombre)` de `@/lib/print` copia el documento a `#print-root` y abre el diálogo de
  impresión (el usuario elige «Guardar como PDF»); las reglas `@media print` están en `global.css`. Los reportes
  imprimen su `ReportPaper`; Finanzas imprime una hoja oculta del escenario (`ScenarioExport`).
- **Excel**: `downloadXlsx(nombre, hojas)` de `@/lib/xlsx` arma un .xlsx real sin dependencias (encabezado del
  documento, formatos `int`/`money`/`pct`/`decimal`, fila de totales). Solo serializa lo que devolvió la API.
- **Notificaciones**: la campana (`NotificationsMenu`) muestra los pendientes del Inicio de cada rol
  (`useNotifications`, misma caché que el Inicio); lo leído se guarda en `useNotificationsStore` (este navegador).
- **Mi perfil** (`/perfil`, `/perfil/seguridad`, `/perfil/actividad`): cualquier rol, fuera del menú; se abre desde el
  usuario de la barra superior o con ⌘K. Nombre, correo y teléfono se editan con `useUpdateProfile` (`PUT /users/me`,
  solo los campos cambiados, a partir de `useMe`); la contraseña con `useChangePassword`; "Mi actividad" usa la
  auditoría (administrador) o las ventas propias (secretaria).
- **Historial de reportes**: cada PDF o Excel descargado se registra con `useRecordExport` (`ReportPreview` lo hace
  solo si recibe `record`; Finanzas desde `ScenarioExport`) y se lista en `ExportHistory` (prototipo 09).
- **Comunicación**: `/chat` (todos los roles; canal general y privados con `?con=<id>`; `useChatMessages(peerId)` pide solo
  lo nuevo cada 4 s con `?after=`; `useChatTeam` da presencia y no leídos, y su consulta periódica desde el menú mantiene
  a la persona "en línea") y
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
  (`TitaPanel`, botón "Tita" de la barra o ⌘J / Ctrl+J). Ambos usan `TitaConversation` y comparten la conversación
  (`useAiStore`, solo en memoria; se borra al cerrar sesión).
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

## Stock vendible y fechas

`Product.stock` es el stock físico (incluye lotes vencidos aún en bodega); `Product.availableStock` es lo que FEFO puede
vender hoy. El punto de venta usa `availableStock`; Inventario muestra el físico y marca las unidades vencidas
(`expiredUnits` de `screens/Inventory/stockStatus.ts`, donde también vive `LOW_STOCK`). `todayIso()` es la fecha local,
no UTC; la API cuenta "hoy" en `BUSINESS_TZ` (America/Bogota). Auditoría de octubre de 2026 en `docs/auditoria/`.

## Hooks disponibles (`@/hooks/<entidad>`)

- session: `useSignin`, `useSignout`, `useMe`
- users: `useUsers(query)`, `useUser(id)`, `useCreateUser`, `useChangePassword`
- categories: `useCategories(query?)`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`
- products: `useProducts(query)`, `useProduct(id)`, `useCreateProduct`, `useUpdateProduct`, `useDeactivateProduct`
- batches: `useProductBatches(productId, query?)`, `useRegisterBatch` ({productId, quantity, expiresAt, unitCost?, supplierId?}), `useExpiringBatches(query)`
- suppliers: `useSuppliers(query?)`, `useCreateSupplier`, `useUpdateSupplier`, `useRegisterPurchase` ({supplierId, productId, quantity, unitCost, expiresAt})
- customers: `useCustomers(query)`, `useCustomer(id)`, `useCustomerBalance(id)`, `useCreateCustomer`, `useUpdateCustomer`, `useRegisterPayment` ({id, amount})
- sales: `useSales(query)`, `useSale(id)`, `useRegisterSale`, `useVoidSale`
- audits: `useAudits(query)`
- reports: `useSalesReport({from, to, groupBy})`, `useInventoryReport(days)`, `useReceivablesReport(overdueDays)`
- financial: `useScenarios()`, `useScenario(id)`, `useCreateScenario`, `useCompareScenarios(ids)`, `useAmortization(id)`, `useSensitivity(id, variable, range?)`, `useBivariate(id, varX, varY)`, `useTornado(id)`

Las consultas son `useQuery` de TanStack (data, isPending, isError, error, refetch); las mutaciones son
`useMutation` (mutate, mutateAsync, isPending, error: ApiError | null, reset).
