# 3. Mapa de organización: actual y propuesto

## Navegación por rol

La estructura de módulos ya era coherente con las tareas de cada rol y con la API (ver matriz de permisos en
[06-pruebas-verificacion.md](06-pruebas-verificacion.md)). Por eso **no se reorganizó la navegación**: se corrigió cómo
se presentaba lo que ya existía.

| Módulo | Administración | Caja (SALES) | Bodega (WAREHOUSE) | Ubicación en la barra |
|---|---|---|---|---|
| Inicio | ✓ | ✓ | ✓ | Píldora |
| Inventario | ✓ | ✓ (consulta) | ✓ | Píldora |
| Lotes y vencimientos | ✓ | — | ✓ | Píldora |
| Ventas (punto de venta · historial) | ✓ | ✓ | — | Píldora |
| Clientes y cartera | ✓ | ✓ | — | Píldora |
| Proveedores | ✓ | — | ✓ (consulta y compras) | "Más" |
| Finanzas y crédito | ✓ | Con candado | — | Píldora |
| Reportes | ✓ | ✓ (solo ventas) | — | Píldora |
| Chat del equipo | ✓ | ✓ | ✓ | "Más" |
| Contactos del sitio | ✓ | — | — | "Más" |
| Usuarios y roles | ✓ | — | — | "Más" |
| Auditoría | ✓ | — | — | "Más" |
| Mi perfil | ✓ | ✓ | ✓ | Avatar y ⌘K |

**Cambios en la navegación:**

- **Módulo con candado (AUD-07).**
  - Antes: círculo casi vacío.
  - Ahora: ícono atenuado, borde punteado, sello con candado y nombre accesible "(acceso restringido)".
- **"Más" (AUD-19).** Sigue siendo una lista desplegable, ahora sin el rol `menu`, que estaba mal aplicado.

## Composición de las pantallas que cambiaron

### Inicio de caja

| Actual (antes) | Propuesto (aplicado) |
|---|---|
| Encabezado · 4 indicadores | Igual |
| Fila: tarjeta destacada (pendientes) · Últimos 7 días · **Hoy en caja (donut)** | Fila: tarjeta destacada · Últimos 7 días · **Últimas ventas** |
| Fila: **Pendientes de hoy** · Últimas ventas | — (se elimina la fila) |

### Inicio de bodega

| Actual (antes) | Propuesto (aplicado) |
|---|---|
| Subtítulo "N lotes por vencer" (contaba vencidos) | "N lotes por vencer en 30 días · M vencidos" |
| Fila: tarjeta destacada · Existencias más bajas · Cuánto les queda a los lotes | Igual |
| Fila: **Qué hacer hoy** · Lotes próximos a vencer | Una tarjeta a todo el ancho: **Lotes por orden de vencimiento** (vencidos y próximos) |

### Lotes y vencimientos

| Actual (antes) | Propuesto (aplicado) |
|---|---|
| Aviso · 4 indicadores · ventana · estante | Igual |
| Tabla (2/3) + **Distribución** (1/3) | Tabla a todo el ancho con la nota de FEFO al pie |

### Finanzas y crédito

| Actual (antes) | Propuesto (aplicado) |
|---|---|
| Pestañas subrayadas propias (`FinanceTabs`), gris sobre verde | `Tabs` del kit en píldora, legibles sobre la franja |

### Usuarios y roles

| Actual (antes) | Propuesto (aplicado) |
|---|---|
| Encabezado con "Cambiar mi contraseña" + "Nuevo usuario" | Solo "Nuevo usuario" |
| Tarjeta propia abre un modal de contraseña | Tarjeta propia lleva a Mi perfil › Seguridad |

### Punto de venta e Inventario

| Actual (antes) | Propuesto (aplicado) |
|---|---|
| "Disponible" = stock físico (incluye vencidos) | "Disponible" = unidades vendibles + etiqueta "N vencidas" |
| Inventario: "Bajo · 4 u." para un producto con todo vencido | "Vencido · 4 u. · 4 vencidas" |

## Propuestas que no se aplicaron

Quedan en [07-pendientes.md](07-pendientes.md) porque requieren una decisión de negocio:

- desactivar cuentas y cambiar roles (P-01);
- alinear los permisos de proveedores entre la API y la interfaz (P-02);
- definir si "sin existencias" debe contar unidades vendibles (P-05).
