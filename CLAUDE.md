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
2. **Ningún color suelto**: solo variables de `src/styles/theme.css`. Dirección visual "cinematográfica"
   (referencia: reel de landings de @marcelodesignx, octubre de 2026): shell `--app-bg` verde casi negro
   #07110C, panel de papel `--ground` #F2F1EB, tarjetas `--surface` con borde `--line` y radio `--radius`
   14px, acento lima `--sprout` #B9EC6F (texto encima `--sprout-ink`), marca `--forest`/`--leaf`, semánticos
   `--good`/`--warn`/`--bad` con sus `-soft`, `-line`, `-tag-bg`, `-tag-fg`; superficies siempre oscuras
   (menú, login, toasts) con `--dark-*`. Tipografía: `--font-heading`/`--font-body` Geist (titulares en
   peso 300 con tracking negativo), `--font-serif` Instrument Serif solo para acentos en cursiva (`<em>` o
   `*así*` en `SplitText`), `--font-mono` Geist Mono para microetiquetas en mayúsculas, `--font-dots` Doto (matriz de puntos) solo para
   la cifra estrella (precarga, pendientes de la portada, número de factura al confirmar una venta). Movimiento:
   `--ease-out`, `--ease-in-out`, `--ease-spring`; las entradas usan `animation-fill-mode: backwards`
   (nunca `both`/`forwards` en contenedores: un `transform` retenido rompe los modales `position: fixed`).
   `global.css` anula todo con `prefers-reduced-motion`. Los SVG de iconos pueden llevar `currentColor`.
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
`Tabs` (segmentado con píldora que se desliza) y `Chips` (píldoras; activa verde bosque) ·
`Callout` (veredicto: tone good|warn|bad con ícono que se dibuja, title 32px ligero, aside a la derecha) · `Toasts`.
`StatCard` pasa los valores de texto con dígitos por `Odometer`; `DataTable` escalona la entrada de filas.
Movimiento en `@/components/motion`: `Reveal` (aparece al entrar en pantalla), `SplitText` (titular por
palabras; `*x*` serif cursiva, `\n` salto), `Odometer` (rodillos por dígito), `Preloader` (intro 0→100 %,
una vez por sesión), `TopoField` (curvas de nivel animadas para superficies oscuras), `ShaderField` (fondo vivo en
WebGL con los colores del tema; se pausa fuera de la vista), `PhotoBackdrop` (fotos en duotono con zoom lento;
las rutas van en `src/lib/media.ts` y los archivos en `public/media/`), `trackSpotlight`
(brillo que sigue al cursor; ya lo usan `Card` y `StatCard`), `useInView`. En `@/components/layout`:
`HeroHeader` (portada oscura de Inicio: eyebrow, titular, subtítulo, acciones y `aside`) y `CommandPalette`
(⌘K / Ctrl+K, montada en el shell). El shell revela al hacer scroll todo `section` o `[data-reveal-item]`
que monta fuera de la vista, y las `NavLink` usan View Transitions (`view-transition-name: page`).
Efectos ligados al scroll con CSS nativo (`animation-timeline: scroll()/view()`) siempre dentro de
`@supports` y anulados con `prefers-reduced-motion`. La portada de Inicio responde "¿está todo bien?":
`statusTitle` + `StatusAside` a partir de los pendientes de `screens/Home/attention.ts`.
Superficies oscuras dentro del panel claro (héroe, ticket del punto de venta, tarjeta de decisión)
reutilizan el kit redefiniendo `--ink`, `--surface`, `--line`… y `--btn-invert` en su contenedor. Gráficos SVG en `@/components/charts`:
`HBarChart`, `VBarChart` ({label, value, alt}[], format), `LineChart` (points, formatX, formatY, marker,
highlightX), `TornadoChart` (data[{label, low, high}], base, format). Encabezado de página: `PageHeader` (microetiqueta numerada según la ruta + h1 con `SplitText` + subtítulo +
acciones) y `BrandMark` de `@/components/layout/AppShell`. Botones en píldora con rótulo que rueda al pasar
el cursor: `primary` verde bosque que se rellena de lima, `secondary` con borde que se rellena de tinta.

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
