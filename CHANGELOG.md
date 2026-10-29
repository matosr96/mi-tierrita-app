# Registro de cambios · Mi Tierrita App

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/). Fechas en hora de Colombia.

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
