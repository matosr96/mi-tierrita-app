# 1. Informe de auditoría integral

**Sistema:** Mi Tierrita SIG. Comprende la app web (`mi-tierrita-app`) y la API REST (`mi-tierrita-api`).
**Fecha:** 16 de octubre de 2026.
**Entorno:** local. App en Vite (`:5173`), API Express (`:4300`) y PostgreSQL 16 en Docker, con datos de prueba.

## Alcance

**Interfaz:**

- Todas las pantallas autenticadas (17 rutas), la página pública y el inicio de sesión.
- Cada pantalla con tres perfiles reales: administración, caja (SALES) y bodega (WAREHOUSE).
- Escritorio (1280 px) y móvil (375 px).

**API:**

- Permisos de todos los recursos.
- Reglas de negocio de venta, crédito, abonos, lotes y FEFO, anulación, reportes y auditoría.

**Fuera de alcance:**

- Rendimiento con carga.
- Pruebas en dispositivos físicos.
- Seguridad de infraestructura (despliegue, TLS).
- Contenido académico de la página pública.

## Método

1. **Reconocimiento.**
   - Rutas de la app y su mapa de roles (`src/router/navigation.ts`).
   - Endpoints de la API con su `authorize`.
   - Reglas en `business-logic/` (FEFO, cupo, abonos, anulación).
   - Guías de los dos repositorios.
2. **Recorrido por perfil.**
   - Se usó una cuenta de prueba por rol.
   - Un recorrido automático en el navegador cargó cada ruta y midió errores de red y de consola, desbordes, nombres accesibles, etiquetas y encabezados.
   - Además, inspección visual de cada pantalla y escenarios a mano (venta, diálogos, menú móvil).
3. **Pruebas funcionales.**
   - Llamadas reales a la API con el token de cada rol: matriz de permisos y 13 casos de reglas de negocio.
4. **Hallazgos.** Se registraron con evidencia, impacto, causa, solución y prioridad ([02-hallazgos.md](02-hallazgos.md)).
5. **Simplificación.** Redundancias evaluadas una por una ([04-matriz-redundancias.md](04-matriz-redundancias.md)).
6. **Corrección.** Solo lo que se pudo verificar ([05-registro-cambios.md](05-registro-cambios.md)).
7. **Verificación.**
   - Pruebas automáticas nuevas.
   - Repetición de las llamadas y del recorrido completo ([06-pruebas-verificacion.md](06-pruebas-verificacion.md)).

## Resultado en una página

**Lo que estaba bien:**

- **Permisos.** Coinciden entre la API y la interfaz en todos los recursos probados. La única diferencia es deliberada y está documentada (P-02).
- **Reglas de negocio.** Las centrales funcionan: FEFO, cupo de crédito, abonos sin cartera negativa, anulación solo por administración y auditoría solo de escrituras exitosas.
- **Recorrido inicial.** Sin errores de consola ni peticiones rechazadas.

**Lo que no estaba bien:** 24 hallazgos. Ninguno es crítico. Hay 3 altos, 10 medios y 11 bajos.

- **Fechas en UTC (AUD-01).**
  - "Hoy" y los cortes por fecha se contaban en UTC.
  - Desde las 7 p. m. en Colombia, las ventas caían en el día siguiente y los atajos "Hoy" pedían mañana.
- **Stock vencido como disponible (AUD-02, AUD-05).**
  - El sistema mostraba como disponible stock que estaba vencido.
  - En el punto de venta eso hacía fallar la venta al confirmarla. En inventario lo presentaba como existencia normal.
- **Lotes vencidos aceptados (AUD-03).** La API aceptaba lotes que ya llegaban vencidos, lo que inflaba el stock con mercancía invendible.
- **Redundancia.**
  - Listas de pendientes duplicadas en los Inicios de caja y bodega.
  - Gráficos que repetían indicadores.
  - Cifras repetidas cuatro veces en Lotes.
  - Dos componentes de pestañas y dos formularios de contraseña.
- **Visual y adaptable.**
  - Pestaña activa ilegible.
  - Módulo con candado invisible.
  - Desbordes en móvil.
  - Decoración tapando texto.
- **Accesibilidad.** Diálogos sin gestión de foco y un rol ARIA mal aplicado.

**Corrección y verificación:**

- Se corrigieron y verificaron los 24.
- La API recibió cambios pequeños: un campo nuevo (`availableStock`), dos validaciones y la zona horaria. No se quitó nada del contrato.
- No se agregaron dependencias.
- No se eliminó ninguna capacidad: lo que se quitó era la misma información repetida en la misma vista.

**Lo que queda:**

- **Lo más importante: no hay forma de desactivar una cuenta ni de cambiar su rol (P-01).** Necesita un endpoint nuevo que debe definirse en el documento de diseño de la API.
- El resto está en [07-pendientes.md](07-pendientes.md).

## Entregables

1. [Informe](01-informe.md), este documento.
2. [Inventario de hallazgos](02-hallazgos.md).
3. [Mapa de organización actual y propuesto](03-mapa-organizacion.md).
4. [Matriz de redundancias](04-matriz-redundancias.md).
5. [Registro de cambios](05-registro-cambios.md).
6. [Pruebas de verificación](06-pruebas-verificacion.md).
7. [Pendientes](07-pendientes.md).
8. [Evaluación final](08-evaluacion-final.md).
