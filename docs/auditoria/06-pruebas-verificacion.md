# 6. Pruebas de verificación

Todo lo de este documento se ejecutó el 16 de octubre de 2026 contra el entorno local:

- app de Vite en `:5173`;
- API en `:4300`;
- PostgreSQL 16 en Docker.

Se usaron tres cuentas de prueba creadas para esto, una por rol: administración, caja y bodega. Sus claves no se
publican en este documento.

## 1. Compilación y pruebas automáticas

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` (app) | Sin errores |
| `pnpm build` (app) | Compila; queda el aviso de tamaño del paquete (P-07) |
| `pnpm typecheck` (API) | Sin errores |
| `pnpm test` (API) | 33 pruebas, 33 pasan, 0 fallan |
| `tests/auditoria.test.ts` › AUD-01 | `todayIso(2026-10-17T01:30Z)` = `2026-10-16` (8:30 p. m. en Bogotá) |
| `tests/auditoria.test.ts` › AUD-03 | `registerBatch` con vencimiento 2020-01-01 → `400` en `expiresAt`, sin tocar la base |
| `tests/auditoria.test.ts` › AUD-04 | Reporte con `from` > `to` → `400` |

Las tres pruebas nuevas fallan con el código anterior y pasan con el actual.

## 2. Matriz de permisos (API real, token de cada rol)

Lecturas (`GET`). Esperado: el código coincide con lo que muestra la interfaz a cada rol.

| Endpoint | ADMIN | SALES | WAREHOUSE |
|---|---|---|---|
| `/auth/me` | 200 | 200 | 200 |
| `/users` | 200 | 403 | 403 |
| `/categories`, `/products`, `/products/1/batches`, `/suppliers` | 200 | 200 | 200 |
| `/batches/expiring` | 200 | 403 | 200 |
| `/customers` | 200 | 200 | 403 |
| `/sales` | 200 | 200 | 403 |
| `/audits` | 200 | 403 | 403 |
| `/reports/sales` | 200 | 200 | 403 |
| `/reports/inventory`, `/reports/receivables` | 200 | 403 | 403 |
| `/reports/exports` | 200 | 200 | 403 |
| `/financial/scenarios` | 200 | 403 | 403 |
| `/chat/messages`, `/chat/team` | 200 | 200 | 200 |
| `/contact-messages` | 200 | 403 | 403 |

Escrituras con cuerpo vacío: `400` significa que el rol pasa la autorización; `403`, que no.

| Escritura | ADMIN | SALES | WAREHOUSE |
|---|---|---|---|
| `POST /customers` | 400 | 400 | 403 |
| `POST /categories`, `/products`, `/suppliers` | 400 | 403 | 400 |
| `POST /sales` | 400 | 400 | 403 |
| `POST /financial/scenarios`, `POST /users` | 400 | 403 | 403 |
| `PUT /users/me` | 400 | 400 | 400 |

**Resultado.** Coincide con la navegación de cada rol. La única diferencia es P-02: la API deja a Bodega crear
proveedores y la interfaz no lo ofrece.

**Autenticación.**

- Clave incorrecta → `401 / 610`.
- Sin token → `401`.
- Token mal formado → `401`.

## 3. Reglas de negocio (API real)

| # | Caso | Esperado | Obtenido |
|---|---|---|---|
| N-01 | Venta de un producto cuyo stock está todo vencido | Rechazo | `409 / 620`, `available: 0` |
| N-02 | Venta con más unidades que el stock | Rechazo | `409 / 620`, `available: 31` |
| N-03 | Venta a crédito sin cliente | `400` | `400` en `customerId` |
| N-04 | Venta a crédito sobre el cupo (cupo 50.000; total 62.500) | Rechazo | `409 / 621` con cupo, saldo y total |
| N-05 | Abono mayor que el saldo | Rechazo | `409 / 623` |
| N-06 | Abono negativo | `400` | `400`, "Mínimo 0.01" |
| N-07 | Lote que ya llega vencido | `400` | **Antes `201`** (AUD-03) → ahora `400` en `expiresAt` |
| N-08 | Producto con precio negativo y sin categoría | `400` | `400` con ambos campos |
| N-09 | Reporte con rango invertido | `400` | **Antes `200` vacío** (AUD-04) → ahora `400` |
| N-10 | Caja intenta anular una venta | `403` | `403 / 613`, `requiredRoles: ["ADMIN"]` |
| N-11 | La auditoría registra solo escrituras exitosas | Sí | Las sondas 400/403 no aparecen; la escritura 201 de N-07 sí (#56) |
| N-12 | La sesión de base de datos trabaja en hora de Colombia | `America/Bogota` | Antes `UTC` (AUD-01) → ahora `America/Bogota`; `'2026-10-17T01:30Z'::date = 2026-10-16` |
| N-13 | `availableStock` en productos | Leche 0, Arroz 31 | `LEC-001 stock 4 / availableStock 0`; `ARR-500 31 / 31` |

## 4. Recorrido en el navegador

Para cada rol y cada ancho se cargaron 17 rutas (Inicio, Inventario, Lotes, Punto de venta, Historial, Clientes,
Proveedores, Finanzas, Finanzas › Escenarios, Reportes, Chat, Contactos, Usuarios, Auditoría y las tres vistas de Mi
perfil). En cada carga se midió:

- respuestas de red ≥ 400;
- errores de consola;
- desborde horizontal;
- botones o enlaces sin nombre accesible;
- campos sin etiqueta;
- imágenes sin `alt`;
- número de `h1`.

| Rol | Escritorio (1280 px) | Móvil (375 px) |
|---|---|---|
| Administración | 17/17 sin incidencias | 17/17 sin incidencias |
| Caja | 17/17 sin incidencias | 17/17 sin incidencias |
| Bodega | 17/17 sin incidencias | 17/17 sin incidencias |

Además:

- La página pública (`/sitio`) y el inicio de sesión no tienen incidencias en ninguno de los dos anchos.
- Una ruta protegida sin sesión lleva a "Iniciar sesión".
- Antes de las correcciones, el mismo recorrido en móvil daba desborde en Historial (187 px), Proveedores (241 px) y Usuarios (32 px) (AUD-09).

Las rutas fuera del rol muestran la pantalla "no está disponible para su cuenta" y no hacen peticiones rechazadas.

## 5. Escenarios de interfaz verificados a mano

| # | Escenario | Resultado |
|---|---|---|
| I-01 | Caja agrega "Leche" (todo vencido) y confirma la venta | **Antes:** se dejaba agregar y fallaba con "Disponible: 0". **Ahora:** "0 · sin stock · 4 vencidas" y botón deshabilitado |
| I-02 | Pestañas de Ventas sobre la franja | La activa es legible (antes: blanco sobre blanco) |
| I-03 | Candado de Finanzas para caja | Visible, con sello; nombre accesible "(acceso restringido)" |
| I-04 | Abrir "Registrar lote", Shift+Tab ×2, Escape | El foco entra, se queda dentro y vuelve al botón |
| I-05 | Campo de vencimiento del lote | `min` = fecha de hoy |
| I-06 | Inicio de bodega | Subtítulo "0 lotes por vencer · 2 vencidos"; sin lista duplicada; el saludo ya no queda bajo el abanico |
| I-07 | Inventario | Leche "Vencido · 4 u. · 4 vencidas" |
| I-08 | Finanzas | Pestañas del kit legibles sobre la franja |
| I-09 | Menú móvil (caja) | Lista por grupos, candado en Finanzas, insignia del chat, "Cerrar sesión" |

## Cómo repetir

1. Levante la base (`docker compose up -d db`), la API (`pnpm dev` en `mi-tierrita-api`) y la app (`pnpm dev`).
2. Cree una cuenta por rol con `POST /users` como administrador.
3. Pruebas automáticas: `pnpm test` en la API, y `pnpm typecheck` y `pnpm build` en la app.
4. Permisos y reglas: repita las llamadas de las tablas 2 y 3 con el token de cada cuenta.
5. Interfaz: entre con cada cuenta y recorra las rutas de la sección 4 a 1280 y 375 px.
