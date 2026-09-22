# Mi Tierrita App

Aplicación de una sola página (SPA) de **Mi Tierrita SIG**: la interfaz que usan el Administrador, la
Secretaria y Bodega para inventario, lotes y vencimientos, punto de venta, clientes y cartera, proveedores,
evaluación financiera de la ampliación, reportes y usuarios. Consume la API de
[mi-tierrita-api](../mi-tierrita-api) y no contiene reglas de negocio propias: toda regla vive en el servidor.

Implementa los documentos 02 (arquitectura del frontend), 07 (diseño del frontend) y 09 (infraestructura del
frontend) de la documentación técnica del TCC.

## Stack

| Componente | Tecnología |
|---|---|
| Interfaz | React 19 + TypeScript |
| Empaquetador | Vite 7 |
| Estado de servidor | TanStack Query (caché y revalidación) |
| Estado global de cliente | Zustand (sesión, tema, notificaciones) |
| Enrutamiento | React Router 7 |
| Cliente HTTP | Axios con interceptores (token, 401 → cierre de sesión) |
| Estilos | CSS modules por componente + variables de tema (claro y oscuro) |

## Puesta en marcha (local)

```bash
pnpm install
cp .env.example .env      # VITE_API_URL=http://localhost:4300/api/v1
pnpm dev                  # http://localhost:5173
```

La API debe estar corriendo (`pnpm dev` en `../mi-tierrita-api`) con al menos un usuario creado con
`pnpm create-admin`.

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con recarga en caliente |
| `pnpm typecheck` | `tsc` sin emitir |
| `pnpm build` | Compila a `dist/` (archivos estáticos) |
| `pnpm preview` | Sirve el build localmente |
| `docker build -t mi-tierrita-app .` | Imagen con Nginx sirviendo el build |

## Configuración por entorno

Solo una variable, en tiempo de build (documento 09): `VITE_API_URL`, la URL base de la API. Cambiarla
implica un build nuevo. Ningún secreto del servidor se compila dentro de la SPA.

## Arquitectura

```
pantalla → hook de la entidad → servicio HTTP → API
```

```
src/
  screens/        una carpeta por pantalla (Home, Inventory, Batches, Sales, Customers, Suppliers,
                  Finance, Reports, Users, Audits, Signin, Restricted)
  hooks/<entidad>/ un hook por operación (useProducts, useCreateProduct, ...) sobre TanStack Query
  services/       un archivo por recurso; único lugar que arma peticiones HTTP
  stores/         estado global de cliente: sesión y rol, tema, notificaciones
  components/     ui (kit reutilizable), charts (SVG), layout (barra lateral, barra superior)
  router/         mapa de pantallas por rol, guardas de sesión y de rol, rutas
  lib/            cliente HTTP, traducción de códigos de error, formato de números y fechas
  types/          tipos de la API
  styles/         variables de tema y estilos base
```

### Reglas que se cumplen en todo el código

1. **Cadena de datos en un solo sentido.** Ninguna pantalla importa un servicio ni el cliente HTTP.
2. **Toda pantalla contempla sus tres estados**: cargando, vacío con llamada a la acción y con datos.
3. **Control de acceso.** Cada ruta declara sus roles en [navigation.ts](src/router/navigation.ts); la
   guarda muestra *Acceso restringido* sin pedir datos al backend, y el menú lateral solo lista los módulos
   del rol activo. Los controles que el rol no puede usar no se muestran.
4. **Un 401 cierra la sesión** local y redirige a *Iniciar sesión*.
5. **El frontend no calcula.** Totales, saldos e indicadores financieros se muestran tal como los devuelve
   la API. El punto de venta solo muestra un subtotal marcado como estimado.
6. **Errores por código.** Los códigos de dominio de la API se traducen en
   [errors.ts](src/lib/errors.ts); un 400 pinta el mensaje junto a cada campo.
7. **Ningún color suelto.** Todo sale de [theme.css](src/styles/theme.css), con tema claro y oscuro.

## Mapa de pantallas por rol

| Pantalla | Ruta | Administrador | Secretaria | Bodega |
|---|---|---|---|---|
| Iniciar sesión | `/iniciar-sesion` | todos sin sesión | | |
| Inicio | `/` | ✓ | ✓ | ✓ |
| Inventario | `/inventario` | edición | consulta | edición |
| Lotes y vencimientos | `/lotes` | ✓ | | ✓ |
| Ventas (punto de venta e historial) | `/ventas`, `/ventas/:tab` | ✓ | ✓ | |
| Clientes y cartera | `/clientes` | ✓ | ✓ | |
| Proveedores | `/proveedores` | ✓ | | ✓ |
| Finanzas (panel, supuestos, escenarios, flujo) | `/finanzas`, `/finanzas/:tab` | ✓ | | |
| Reportes | `/reportes` | ✓ | solo ventas | |
| Usuarios y roles | `/usuarios` | ✓ | | |
| Auditoría | `/auditoria` | ✓ | | |
| Acceso restringido | cualquier ruta sin permiso | ✓ | ✓ | ✓ |

## Producción

`pnpm build` genera archivos estáticos que cualquier hosting o CDN sirve por HTTPS. El
[Dockerfile](Dockerfile) empaqueta el build en Nginx con `try_files` para que las rutas de la SPA carguen
al refrescar. CI ([ci.yml](.github/workflows/ci.yml)) hace typecheck, build y construye la imagen.
