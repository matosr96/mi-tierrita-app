# Mi Tierrita App — guía para sesiones de trabajo

SPA de Mi Tierrita SIG (React 19 + TypeScript + Vite, TanStack Query, Zustand, React Router 7, Axios,
CSS modules con variables de tema). Consume la API de `../mi-tierrita-api` (`VITE_API_URL`, por defecto
`http://localhost:4300/api/v1`). El diseño canónico son los documentos 02 (arquitectura), 07 (diseño) y 09
(infraestructura) del TCC y las capturas de `~/Desktop/TCC Ingenieria Economica/2 Capturas de las vistas`.

## Comandos

`pnpm dev` (puerto 5173) · `pnpm typecheck` · `pnpm build` · `pnpm preview`.

## Cadena de datos en un solo sentido

`pantalla → hook de la entidad → servicio HTTP → API`. Una pantalla nunca importa un servicio ni el cliente
HTTP; solo usa hooks. Un hook por operación (`src/hooks/<entidad>/useX.ts`), un servicio por recurso
(`src/services/<recurso>.ts`), tipos de la API en `src/types/api.ts`, estado global en `src/stores/`.

## Reglas de oro

1. **Toda pantalla contempla sus tres estados**: cargando, vacío (con llamada a la acción) y con datos.
   Usar `QueryState` / `Loading` / `EmptyState` / `ErrorState` de `@/components/ui`.
2. **Ningún color suelto**: solo variables de `src/styles/theme.css` (`--forest`, `--leaf`, `--sprout`,
   `--sprout-soft`, `--ground`, `--surface`, `--surface-2`, `--ink`, `--ink-2`, `--muted`, `--line`,
   `--amber`, `--amber-fg`, `--amber-soft`, `--clay`, `--clay-fg`, `--clay-soft`, `--radius`, `--radius-sm`,
   `--shadow`, `--font-heading`, `--font-body`). Tema claro y oscuro salen solos de ahí.
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
`Tabs` y `Chips` · `Callout` (tone, title, aside) · `Toasts`. Gráficos SVG en `@/components/charts`:
`HBarChart`, `VBarChart` ({label, value, alt}[], format), `LineChart` (points, formatX, formatY, marker,
highlightX), `TornadoChart` (data[{label, low, high}], base, format). Encabezado de página: `PageHeader`
de `@/components/layout/AppShell`.

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
