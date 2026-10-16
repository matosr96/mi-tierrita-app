# 7. Pendientes

Lo que no se corrigió en esta auditoría y por qué. Ninguno de estos puntos se marca como resuelto.

| ID | Pendiente | Prioridad | Por qué no se hizo | Qué haría falta |
|---|---|---|---|---|
| P-01 | **No se pueden desactivar cuentas ni cambiar roles.** La API no tiene `PUT/PATCH /users/:id` y Usuarios solo crea. Una persona que deja la tienda conserva su acceso; la única salida es la base de datos. | Alta | Es un endpoint nuevo con efectos de seguridad (revocar sesiones: el token ya lleva `tv`, versión de token) que debe definirse en el documento 06 antes de implementarse (regla del CLAUDE.md de la API). | Diseñar `PATCH /users/:id {active, role}` solo ADMIN, que suba la versión del token para cerrar las sesiones abiertas, impida desactivarse a sí mismo y al último administrador; botón "Desactivar" en `PersonCard`. |
| P-02 | **Permisos de proveedores distintos entre API e interfaz.** La API deja a Bodega crear y editar proveedores (`POST/PUT /suppliers` → `400` por cuerpo inválido, no `403`); la interfaz lo oculta por una decisión del lienzo (comentario en `SuppliersScreen.tsx`). | Media | Cambiar los permisos de la API puede romper un flujo que alguien use; la decisión es del negocio. | Elegir una de dos: restringir la API a ADMIN (y actualizar documento 06 y README) o mostrar "Nuevo proveedor" a Bodega. |
| P-03 | Escenarios financieros repetidos en la base local (A–C y D–F con los mismos nombres). | Baja | Son datos de prueba; no es un defecto del código. La API no impide nombres repetidos. | Limpiar datos de semilla; opcionalmente validar nombre único. |
| P-04 | La barra superior cambia de alto al compactarse (≈44 px). En páginas que apenas desplazan puede dar un salto. No se vio un bucle en las pruebas. | Baja | Riesgo bajo; tocarlo afecta todas las pantallas. | Reservar la altura con un espaciador o animar con `transform` en vez de `padding`. |
| P-05 | "Sin existencias" cuenta stock físico (incluye vencidos) en los indicadores y en `GET /reports/inventory`. Ahora la interfaz marca los vencidos, pero el conteo sigue siendo físico. | Media | Cambia la definición de un indicador del reporte del servidor. | Definir con el negocio si "sin existencias" debe significar "nada vendible"; si sí, usar `availableStock` en el reporte. |
| P-06 | La pantalla ilustrativa de la página pública (`DashboardMock`) aún muestra la barra anterior al encabezado alto. | Baja | Fuera del alcance funcional. | Actualizar el mock. |
| P-07 | El paquete principal pesa más de 500 kB minificado (aviso de Vite). | Baja | No afecta la funcionalidad; requiere dividir rutas. | `lazy()` por pantalla, como ya se hace con la página pública. |
| P-08 | Las reglas de negocio se verificaron con llamadas reales, pero la suite de la API solo tiene pruebas unitarias (sin base). | Media | Montar pruebas de integración con base de datos es un cambio de infraestructura de pruebas. | Base de pruebas en Docker y pruebas de venta/anulación/abono/FEFO. |
| P-09 | Si la API se despliega detrás de un *pooler* que no acepte el parámetro `options`, la zona horaria no se aplicaría. | Baja | El despliegue actual usa conexión directa. | En ese caso, `ALTER ROLE ... SET timezone = 'America/Bogota'`. |

## Pendientes heredados (anteriores a la auditoría)

- Publicar el rediseño y los cambios de esta auditoría en GitHub: espera la aprobación del autor.
- Datos de contacto de la tienda para la página pública: sin confirmar, por eso siguen ocultos.
