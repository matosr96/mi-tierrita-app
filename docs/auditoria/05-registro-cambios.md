# 5. Registro de cambios

Cambios hechos durante la auditoría, por repositorio. Cada uno remite a su hallazgo. No se agregó ninguna dependencia
ni servicio, ni se quitó o cambió ningún campo de la API: el único cambio de contrato es aditivo (`availableStock`),
y los otros dos convierten entradas inválidas en `400` (lote vencido, rango invertido).

> Estos cambios se suman al rediseño de la app que aún no está publicado; nada de esto se ha subido a GitHub.

## API (`mi-tierrita-api`)

| Archivo | Cambio | Hallazgo |
|---|---|---|
| `src/common/dates.ts` | `BUSINESS_TIME_ZONE` (variable `BUSINESS_TZ`, por defecto `America/Bogota`); `todayIso(now?)` formatea en esa zona | AUD-01 |
| `src/data-sources/db.ts` | El pool abre cada sesión con `options: -c TimeZone=<zona>` | AUD-01 |
| `src/business-logic/batches/register-batch.ts` | Rechaza `expiresAt` anterior a hoy con `400` (aplica también a compras a proveedor) | AUD-03 |
| `src/controllers/reports/sales-report.ts` | `from > to` responde `400` en `from` | AUD-04 |
| `src/business-logic/products/find-product.ts`, `src/models/products.ts` | Campo calculado `availableStock` (lotes no vencidos) en todas las respuestas de producto | AUD-02 |
| `docs/openapi.yaml` | `availableStock` en `Product`; regla de vencimiento en los dos cuerpos que reciben `expiresAt` | AUD-02, AUD-03 |
| `README.md`, `.env.example` | Variable `BUSINESS_TZ` | AUD-01 |
| `tests/auditoria.test.ts` (nuevo) | Pruebas AUD-01, AUD-03 y AUD-04 | — |

## App (`mi-tierrita-app`)

| Archivo | Cambio | Hallazgo |
|---|---|---|
| `src/lib/format.ts` | `todayIso()` con la fecha local | AUD-01 |
| `src/types/api.ts` | `Product.availableStock` | AUD-02 |
| `src/screens/Sales/PointOfSale.tsx` | Disponible, tope del carrito y botón con unidades vendibles; etiqueta "N vencidas" | AUD-02 |
| `src/screens/Batches/BatchForm.tsx` | `min` de hoy y validación de vencimiento | AUD-03 |
| `src/screens/Inventory/stockStatus.ts`, `ProductMosaic.tsx`, `InventoryScreen.tsx` | `expiredUnits()`, estado "Vencido", texto "N vencidas" | AUD-05 |
| `src/screens/Home/homeDates.ts`, `ActivityCard.tsx` | `whenShort()`; título neutro mientras carga; se quita `scrollToPending` | AUD-06, AUD-21, AUD-23 |
| `src/components/layout/AppShell.tsx`, `AppShell.module.css` | Candado visible y anunciado; pestañas legibles sobre la franja; "Más" sin `role="menu"` | AUD-07, AUD-08, AUD-19 |
| `src/components/ui/DataTable.module.css`, `src/screens/Users/AccessMatrix.module.css`, `src/screens/Sales/SalesFilterBar.module.css` | Contención de textos solo para lectores; filtros que se encogen en móvil | AUD-09 |
| `src/screens/Home/SalesHome.tsx` | Sin "Pendientes de hoy" ni "Hoy en caja"; "Últimas ventas" en la rejilla | AUD-10, AUD-11 |
| `src/screens/Home/WarehouseHome.tsx` | Sin "Qué hacer hoy"; subtítulo con vencidos aparte; tabla renombrada | AUD-10, AUD-12 |
| `src/screens/Home/attention.ts` | Tipo `AttentionItem`; pendientes con unidades vendibles; `LOW_STOCK` importado | AUD-13, AUD-23 |
| `src/screens/Home/StatusAside.tsx` (+ los tres Inicios) | Propiedad `watches` con el texto de cada rol | AUD-21 |
| `src/screens/Batches/BatchesScreen.tsx`, `.module.css` | Sin "Distribución"; tabla a todo el ancho con nota de FEFO | AUD-14 |
| `src/components/ui/Tabs.tsx`, `src/screens/Finance/FinanceScreen.tsx`, `.module.css` | `Tabs` acepta `ariaLabel` y desplaza la activa a la vista; Finanzas lo usa sobre la franja | AUD-15 |
| `src/screens/Users/UsersScreen.tsx` | Sin modal de contraseña; la tarjeta propia lleva a Mi perfil › Seguridad | AUD-16 |
| `src/screens/Profile/ProfileForm.tsx` | Texto de ayuda de Usuario y Rol | AUD-17 |
| `src/components/ui/Modal.tsx`, `Modal.module.css` | Foco al abrir, Tab cíclico, foco de vuelta al cerrar | AUD-18 |
| `src/components/layout/HeroHeader.module.css` | Texto limitado junto al abanico; sin alto reservado en móvil | AUD-20, AUD-24 |
| `src/components/ui/States.module.css` | Texto de carga sin mayúsculas ni mono | AUD-22 |
| `src/screens/Home/HomeScreen.module.css` | Se quita `.gridEven` | AUD-23 |
| `src/components/layout/useNotifications.ts` | Importa `AttentionItem` de `attention.ts` | AUD-23 |

**Archivos eliminados (app):**

- `src/screens/Batches/DistributionCard.tsx`;
- `src/screens/Finance/FinanceTabs.tsx` y `FinanceTabs.module.css`;
- `src/screens/Users/ChangePasswordModal.tsx`;
- `src/screens/Home/AttentionCard.tsx`;
- `src/screens/Home/AttentionList.tsx`.

## Datos de la base local

- Durante la prueba de AUD-03 se creó un lote vencido (id 9, 1 unidad de Arroz). Se retiró después en una sola transacción: se borró el lote y se restó la unidad del stock. El stock de Arroz volvió a 31.
- La auditoría conserva el registro de esa escritura (#56), como corresponde.
- No se modificó ningún otro dato.
