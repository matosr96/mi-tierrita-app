# Mi Tierrita App

Aplicación de una sola página (SPA) de **Mi Tierrita SIG**, el sistema de una agropecuaria en Sahagún, Córdoba. La usan
la administración, la caja (Secretaria) y la bodega para inventario, lotes y vencimientos, punto de venta, clientes y
cartera, proveedores, evaluación financiera de la ampliación, reportes, chat del equipo y usuarios. Incluye la página
pública de la tienda y a **Tita**, la asistente con IA. Consume la API de [mi-tierrita-api](../mi-tierrita-api) y no
contiene reglas de negocio propias: toda regla vive en el servidor.

Implementa los documentos 02 (arquitectura del frontend), 07 (diseño del frontend) y 09 (infraestructura del
frontend) del Trabajo Colaborativo Contextualizado. La auditoría integral del sistema está en
[docs/auditoria](docs/auditoria/README.md).

## Stack

| Componente | Tecnología |
|---|---|
| Interfaz | React 19 + TypeScript |
| Empaquetador | Vite 7 |
| Estado de servidor | TanStack Query (caché y revalidación) |
| Estado global de cliente | Zustand (sesión, notificaciones leídas, conversación con Tita) |
| Enrutamiento | React Router 7 |
| Cliente HTTP | Axios con interceptores (token, 401 → cierre de sesión) |
| Estilos | CSS modules por componente + variables de tema; tipografía Urbanist |
| Gráficos, PDF y Excel | SVG propios, impresión del navegador y un escritor de .xlsx propio (sin dependencias) |
| Voz | Reconocimiento y síntesis de voz del navegador (Web Speech API) |

## Puesta en marcha (local)

```bash
pnpm install
cp .env.example .env      # VITE_API_URL=http://localhost:4300/api/v1
pnpm dev                  # http://localhost:5173
```

La API debe estar corriendo (`pnpm dev` en `../mi-tierrita-api`) con al menos un usuario creado con
`pnpm create-admin`. Tita aparece solo si la API tiene `ANTHROPIC_API_KEY`; sin ella la app funciona igual y oculta
todo lo de IA.

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con recarga en caliente |
| `pnpm typecheck` | `tsc` sin emitir |
| `pnpm build` | Compila a `dist/` (archivos estáticos) |
| `pnpm preview` | Sirve el build localmente |
| `docker build -t mi-tierrita-app .` | Imagen con Nginx sirviendo el build |

## Configuración por entorno

Solo una variable, en tiempo de build (documento 09): `VITE_API_URL`, la URL base de la API. Cambiarla
implica un build nuevo. Ningún secreto se compila dentro de la SPA: la clave de IA vive solo en el servidor.

## Arquitectura

```
pantalla → hook de la entidad → servicio HTTP → API
```

```
src/
  screens/        una carpeta por pantalla (Home, Inventory, Batches, Sales, Customers, Suppliers, Finance,
                  Reports, Chat, Contacts, Users, Audits, Profile, Tita, Signin, Landing, Restricted)
  hooks/<entidad>/ un hook por operación (useProducts, useCreateProduct, ...) sobre TanStack Query
  services/       un archivo por recurso; único lugar que arma peticiones HTTP
  stores/         estado global de cliente: sesión y rol, notificaciones, conversación con Tita
  components/     ui (kit reutilizable), charts (SVG), layout (barra superior, encabezados), ai (Tita)
  router/         mapa de pantallas por rol, guardas de sesión y de rol, rutas
  lib/            cliente HTTP, errores, formato, impresión a PDF, Excel, lectura de adjuntos
  types/          tipos de la API
  styles/         variables de tema y estilos base
```

### Reglas que se cumplen en todo el código

1. **Cadena de datos en un solo sentido.** Ninguna pantalla importa un servicio ni el cliente HTTP.
2. **Toda pantalla contempla sus tres estados**: cargando, vacío con llamada a la acción y con datos.
3. **Control de acceso.** Cada ruta declara sus roles en [navigation.ts](src/router/navigation.ts); la
   guarda muestra *Acceso restringido* sin pedir datos al backend, y la barra superior solo lista los módulos
   del rol activo (Finanzas aparece con candado para la caja). Los controles que el rol no puede usar no se muestran.
4. **Un 401 cierra la sesión** local y redirige a *Iniciar sesión*.
5. **El frontend no calcula.** Totales, saldos e indicadores se muestran tal como los devuelve la API. El punto de
   venta solo muestra un total marcado como estimado.
6. **Errores por código.** Los códigos de dominio de la API se traducen en
   [errors.ts](src/lib/errors.ts); un 400 pinta el mensaje junto a cada campo.
7. **Ningún color suelto.** Todo sale de [theme.css](src/styles/theme.css): un solo tema claro en verde pastel,
   movimiento mínimo dentro de la app (la página pública conserva sus animaciones).
8. **Fechas locales.** "Hoy" es la fecha del equipo, no UTC; la API cuenta en hora de Colombia.

## Tita, la asistente

Tita responde con los datos reales del sistema y hace lo que la cuenta de cada persona puede hacer, siempre con
confirmación:

- **Dónde:** página `/tita` y panel rápido desde la barra (botón "Tita" o Ctrl+J / ⌘J); comparten la conversación,
  que vive solo en memoria y se borra al cerrar sesión.
- **Consultar:** ventas, existencias vendibles, lotes, saldos, reportes y escenarios financieros, según el rol.
- **Actuar:** crear y editar clientes, productos, categorías y proveedores; registrar ventas, abonos, compras y lotes;
  anular ventas; crear escenarios; atender contactos; escribirle al equipo; abrir reportes. Cada acción llega como
  tarjeta y solo se ejecuta al pulsar Confirmar, contra el mismo endpoint de la API (mismas validaciones y permisos) y
  queda en la auditoría con la marca "IA". No crea usuarios ni maneja contraseñas.
- **Adjuntos:** fotos (facturas, pedidos), PDF, Excel (.xlsx), CSV y .txt, hasta 4 por pregunta.
- **Voz en vivo:** escucha, responde en voz alta y vuelve a escuchar (Chrome, Edge o Safari).
- **Además:** "Sugerencias de hoy" en el Inicio (qué reponer, qué rotar antes de que venza, a quién cobrar),
  borradores de mensajes de cobro y respuestas, lectura de reportes, explicación de escenarios y entrada de mercancía
  por foto de factura en Proveedores.

## Mapa de pantallas por rol

| Pantalla | Ruta | Administrador | Secretaria (caja) | Bodega |
|---|---|---|---|---|
| Página pública | `/sitio` (y `/` sin sesión) | todos | | |
| Iniciar sesión | `/iniciar-sesion` | todos sin sesión | | |
| Inicio | `/` | ✓ | ✓ | ✓ |
| Inventario | `/inventario` | edición | consulta | edición |
| Lotes y vencimientos | `/lotes` | ✓ | | ✓ |
| Ventas (punto de venta e historial) | `/ventas`, `/ventas/:tab` | ✓ | ✓ | |
| Clientes y cartera | `/clientes` | ✓ | ✓ | |
| Proveedores | `/proveedores` | ✓ | | consulta y compras |
| Finanzas (panel, supuestos, escenarios, flujo) | `/finanzas`, `/finanzas/:tab` | ✓ | con candado | |
| Reportes | `/reportes` | ✓ | solo ventas | |
| Tita | `/tita` | ✓ | ✓ | ✓ |
| Chat del equipo | `/chat` | ✓ | ✓ | ✓ |
| Contactos del sitio | `/contactos` | ✓ | | |
| Usuarios y roles | `/usuarios` | ✓ | | |
| Auditoría | `/auditoria` | ✓ | | |
| Mi perfil | `/perfil`, `/perfil/:tab` | ✓ | ✓ | ✓ |
| Acceso restringido | cualquier ruta sin permiso | ✓ | ✓ | ✓ |

## Producción

`pnpm build` genera archivos estáticos que cualquier hosting o CDN sirve por HTTPS. El
[Dockerfile](Dockerfile) empaqueta el build en Nginx con `try_files` para que las rutas de la SPA carguen
al refrescar. CI ([ci.yml](.github/workflows/ci.yml)) hace typecheck, build y construye la imagen.

## Licencias

### Código del proyecto

© 2026 Karina Redondo Sáez, Alexa Patricia Ricardo Lozano y Edgar Alexander Matos Rivera. **Todos los derechos
reservados.** Mi Tierrita SIG es un Trabajo Colaborativo Contextualizado del programa de Ingeniería de Software de la
Universidad de Cartagena. El código se puede consultar en este repositorio, pero no se concede permiso para usarlo,
copiarlo, modificarlo ni distribuirlo sin autorización escrita de los autores (por eso `package.json` declara
`"license": "UNLICENSED"`). El texto completo está en [LICENSE](LICENSE).

Las ilustraciones propias del sistema —Tita (la plantita), el abanico de vidrio, las pantallas ilustrativas de la página
pública y los íconos de la navegación— forman parte del proyecto y tienen la misma reserva.

### Dependencias

Todas las dependencias de producción de la app (39 paquetes, incluidas las transitivas) usan la licencia **MIT**:

| Paquete | Licencia |
|---|---|
| react, react-dom | MIT |
| react-router-dom | MIT |
| @tanstack/react-query | MIT |
| zustand | MIT |
| axios | MIT |

El detalle actualizado se obtiene con `pnpm licenses list --prod`.

### Tipografías

[Urbanist](https://fonts.google.com/specimen/Urbanist) y [Geist Mono](https://fonts.google.com/specimen/Geist+Mono), servidas
desde Google Fonts, bajo la **SIL Open Font License 1.1**.

### Fotografías y logos

- **Fotos de la página pública** (catálogo y banda de cierre): de [Unsplash](https://unsplash.com), bajo la
  [licencia de Unsplash](https://unsplash.com/license), que permite usarlas y modificarlas sin pedir permiso. Cada foto,
  su autor y su enlace están en [public/media/LEEME.txt](public/media/LEEME.txt).
- **Logo de la Universidad de Cartagena**: marca de la universidad. Se muestra solo para identificar el programa académico
  del proyecto; no queda cubierto por la licencia de este repositorio.
