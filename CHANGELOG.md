# Registro de cambios · Mi Tierrita App

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/). Fechas en hora de Colombia.

## [Sin publicar] · Líneas de producto iguales en la página pública y en el sistema (6/11/2026)

### Cambiado
- La página pública lee sus líneas de producto de la API (`usePublicLines`, `GET /categories/public`): catálogo, chips del héroe y pie muestran las categorías activas con código, en el orden 01…06. `lines.ts` arma el corte tipográfico (`splitLineName`: la última palabra es el acento) y la foto y la escena se eligen por código. `LINES_FALLBACK` de `content.ts` se pinta solo mientras la API responde o si no responde; el texto «Seis líneas para la finca…» ya no lleva el número.
- Inventario: los chips «Todas las líneas», el `Select` del formulario de producto y el modal de categorías salen en el orden de la página pública (01…06) y después las internas. El indicador «Productos activos · en N líneas» cuenta solo las líneas activas con productos.
- Modal de categorías: «Renombrar» pasa a «Editar» (nombre, descripción y subfamilias separadas por coma); cada fila muestra `L-NN · Página pública`, las subfamilias y la descripción. Una categoría nueva queda interna (sin código) y no aparece en la página pública.

### Añadido
- Tipos `PublicCategory`, `CategoryInput` y los campos `code`, `description` y `tags` en `Category`; pruebas en `tests/lines.test.ts`.

## [Sin publicar] · Informe del proyecto en Reportes, simulador simplificado y barra sin rebote (5/11/2026)

### Añadido
- Reportes tiene cuatro entradas: Ventas (R-01), Inventario (R-02), Cartera (R-03) e **Informe del proyecto** (S-01, solo Administrador; la Secretaria sigue viendo únicamente Ventas). El informe (`Reports/ProjectReportPanel.tsx`, `projectReport.ts`) elige el escenario en un selector (proyectos guardados de todos los administradores y, al final, el ejemplo de la ampliación; `?r=proyecto&proyecto=<id|ejemplo>` lo preselecciona), comparte la plantilla de los otros reportes (vista previa, portada con folio y QR, pie «Página X de Y», historial rotulado «Informe del proyecto») y exporta a PDF y Excel con 15 hojas. Botón «Abrir en el simulador».
- Simulador: cada pestaña abre con la pregunta del brief y la línea «Viene de … · Alimenta a …» (`TabIntro`, `SIM_TABS`); las entradas secundarias van en un bloque plegable «Avanzado» (`Disclosure`, nuevo en el kit, que se abre solo si un campo de dentro trae un error de la API); cada pestaña destaca un resultado (`Highlight`).
- Inversión: dos tarjetas separadas, «Depreciación de activos fijos» (año, depreciación, valor neto) y «Amortización de diferidos», con sus totales del horizonte tal como los devuelve la API ($31.000.000 y $6.500.000 en el ejemplo); el informe lleva la sección 3 con las dos tablas y las hojas «3 Depreciación» y «3 Amortización diferidos». En Financiación la tabla se llama «Tabla de amortización del crédito».
- Tita propone el informe del proyecto: sugerencias en Reportes y Finanzas, tarjeta «Informe del proyecto» que abre Reportes con el escenario, y el manual de Tita de Administración lo nombra.

### Cambiado
- «Exportar escenario» (encabezado, pestaña Riesgos e informe y cada fila de Escenarios) es solo un atajo a Reportes → Informe con ese escenario (`Finance/ExportScenarioLink.tsx`); con cambios sin guardar queda deshabilitado («Guarde el proyecto para exportarlo»).
- Barra superior: ya no rebota al hacer scroll. `components/layout/topbar.ts` aplica histéresis (compacta pasados 64 px, expande solo bajo 16 px) y una guarda de altura (solo compacta si la página seguirá teniendo recorrido); la regla es una función pura con prueba (`tests/topbar.test.ts`).
- Escenarios: la tabla de proyectos se apila en tarjetas bajo 640 px en vez de desplazarse en horizontal.

### Quitado
- `Finance/SimulatorReport.tsx` y el modal «Exportar proyecto»: el informe vive solo en Reportes, sin lógica duplicada.

## [Sin publicar] · Fase B del brief: simulador financiero (29/10/2026)

### Cambiado
- Finanzas es ahora el simulador financiero: pestañas Mercado, Competencia, Costos, Inversión, Financiación, Flujo de caja, Riesgos e informe y Escenarios. Cada cambio se recalcula en la API; la pantalla, el informe, «Exportar», el Inicio y Tita muestran las mismas cifras.
- La tarjeta «Decisión abierta» del Inicio muestra el último proyecto del simulador.

### Añadido
- «Guardar proyecto», «Guardar como», lista por usuario o de todos, abrir, comparar de dos a cuatro proyectos, exportar cada uno y eliminar los propios.
- Informe PDF y Excel en seis secciones en el orden de las pestañas, con folio y el párrafo de tasas (escudo fiscal, origen de la tasa mínima y TIR frente al crédito).

### Quitado
- Las vistas del modelo del capítulo 5 (Panel, Datos y supuestos, Escenarios y sensibilidad, Flujo y amortización) y sus hooks.

## [Sin publicar] · Fase A del brief de octubre de 2026

### Añadido
- Tita: respuesta en dos pasos (consulta cada 1,5 s), avisos de error claros («tardó demasiado», «sin conexión», «error con código») con reintento automático solo por caída de red y botón «Intentar de nuevo».
- Tita: historial de conversaciones (botones «Historial» y «Nueva conversación» en el panel y en la página).
- Tita: preguntas sugeridas según la pantalla, enlaces internos en las respuestas, autocompletado al escribir (Tab), orbe 3D con «reducir movimiento», lanzador flotante en toda pantalla y manual de Tita en `/ayuda/tita` (general y por rol).
- Biblioteca (`/biblioteca`): documentos y enlaces por rol con vista previa en el visor propio (`DocumentViewer`); foto de perfil editable (`UserAvatar` en la barra, Usuarios y Mi perfil).
- Búsqueda global (Ctrl+K) de productos, clientes, personas, proveedores y pantallas; pestañas «Comentarios» e «Historial» en las fichas de producto, cliente y venta.
- Alarmas (`/alarmas`): próximas y pasadas, interruptor activar/apagar, editar, eliminar, aviso en pantalla al sonar y descarga `.ics`; avisos de vencimiento por rol en la campana; Web Push con service worker (`public/sw.js`) e interruptor en Mi perfil.
- Pruebas automáticas de la app (`pnpm test`, `node:test` + `tsx`) para los módulos puros.
- @Tita en el chat del equipo y en los comentarios: Tita responde ahí mismo; solo quien la mencionó confirma o descarta sus tarjetas.
- Calendario (`/calendario`, todos los roles): vista Mes y Agenda con lotes por vencer, cobros, alarmas propias y cierres de mes según el rol, filtros por prioridad y área, resumen de pendientes, vencidos y cerrados; tarjeta «Esta semana» en el Inicio de administración.
- Ficha de persona: al tocar un avatar o un nombre (chat, comentarios, Usuarios, actividad, venta) se abre con rol, contacto, presencia y acciones según el rol de quien mira.
- Modo oscuro opcional (Mi perfil → Apariencia: Claro, Oscuro o Del dispositivo); la impresión siempre sale en claro.
- Modos de vista Tarjetas / Lista / Tabla (`ViewSwitch`, recordados en este navegador) en Inventario, Clientes y Proveedores; las tablas se apilan en tarjetas rotuladas bajo 640 px (los reportes conservan el desplazamiento horizontal).
- Conteos de inventario (`/conteos`, ADMIN y bodega): programar, hoja de conteo cómoda en el celular con guardado a medias, envío y, para la administración, revisión y aplicación del ajuste contra el stock actual.
- Nómina (`/nomina`, solo Administrador): empleados, periodos mensuales o quincenales con edición en línea de horas extra, bonificaciones, auxilio de transporte y descuentos en borrador, aprobar, marcar pagado, eliminar borrador y exportar a Excel; aviso de que es una liquidación simplificada y no reemplaza la nómina electrónica de la DIAN.
- Pedidos (`/pedidos`): a proveedores (ADMIN y bodega) y de clientes (ADMIN y secretaria), con recepción parcial o completa que crea los lotes, entrega con la venta del punto de venta («Registrar la venta» lo abre prellenado y vuelve al pedido), cancelación con confirmación, filtros por estado y vencidos resaltados.
- Pedidos, nómina y conteos en la campana, el calendario y las sugerencias y el manual de Tita; los diálogos se pintan sobre la barra superior en el celular.

### Cambiado
- Contraste AA en los grises de texto, el verde de los botones, los colores de estado y la franja del encabezado; ningún color suelto fuera de `theme.css`.
- El pie de los diálogos se acomoda en pantallas angostas y el orbe de Tita se aparta mientras hay un diálogo abierto.
- Avisos (`Toasts`): regiones vivas siempre presentes, errores anunciados como alerta, cerrables con teclado. `ErrorState` y los errores de `Field` se anuncian y enlazan al control.

## [0.1.0] · 2026-10-28
- Estado previo a la Fase A: pantallas por rol, Tita, chat del equipo en vivo, reportes PDF y Excel, finanzas y página pública.
