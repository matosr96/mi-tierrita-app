# Manual de usuario · Mi Tierrita

Guía de uso del sistema por rol. Describe las pantallas tal como están en la app (octubre de 2026). Tita tiene su
propio manual dentro de la app, en **Tita → Manual de Tita** (`/ayuda/tita`, general y por rol).

Hay tres roles: **Administrador** (`ADMIN`), **Secretaria** (`SALES`, caja) y **Bodega** (`WAREHOUSE`). Cada persona
solo ve los módulos de su rol; los botones de lo que su rol no puede hacer no aparecen.

## 1. Lo común a todos los roles

### Entrar y moverse
- **Iniciar sesión** con el usuario y la contraseña que le dio el administrador. No hay registro público.
- **Menú**: la píldora de arriba lleva a los módulos principales; el resto está en «Más». En el celular, el botón de
  tres líneas abre el menú completo.
- **Búsqueda global (Ctrl+K o ⌘K, o la lupa)**: escriba el nombre de un producto, un cliente, una persona, un
  proveedor o una pantalla y pulse Enter. Solo aparecen los grupos que su rol puede ver.
- **Campana**: pendientes de su rol (lotes por vencer o vencidos, cartera, alarmas que sonaron hoy, mensajes del chat).
- **Ficha de persona**: toque el nombre o el avatar de alguien (en el chat, los comentarios, Usuarios, una venta) para
  ver su rol, contacto y si está en línea, y para escribirle.

### Inicio
Responde «¿está todo bien?» para su rol: indicadores, la tarjeta de pendientes y las «Sugerencias de hoy» (reponer,
rotar lotes, cobrar, productos sin rotación) con su porqué en cifras. La administración ve además «Esta semana», la
agenda de los próximos siete días.

### Inventario
Productos con stock físico, stock vendible (lo que no está vencido) y precio. Cambie la vista entre **Tarjetas**,
**Lista** y **Tabla**; la elección se recuerda en este navegador. Toque un producto para ver sus lotes, sus
**Comentarios** y, si es administrador, su **Historial** de cambios.

### Calendario
Vista de **Mes** y de **Agenda** con lo que tiene fecha: lotes por vencer y vencidos (administración y bodega), cobros
de cartera (administración y secretaria), pedidos por llegar o entregar (según su rol), pagos de nómina
(administración), conteos de inventario (administración y bodega), sus alarmas y los cierres de mes. Filtre por prioridad y por área. Lo vencido
se marca en rojo; arriba está el resumen de pendientes, vencidos y cerrados. Toque un ítem para ir a su pantalla.

### Alarmas
Avisos que usted programa: título, descripción, hora, repetición (una vez, todos los días, de lunes a viernes o ciertos
días de la semana) y área del sistema. En **Próximas** puede encenderlas o apagarlas, editarlas y eliminarlas; en
**Pasadas** ve cuándo sonaron. Cuando una alarma suena aparece un aviso en pantalla. Con **Agregar al calendario (.ics)**
se descarga para el calendario del teléfono, y con el interruptor de avisos del dispositivo (también en Mi perfil) llega
aunque la pestaña esté cerrada. Tita también puede preparar una alarma para que usted la confirme.

### Chat del equipo
Canal **#general** y conversaciones privadas. Puede responder citando un mensaje, abrir hilos, fijar mensajes, mencionar
con «@» (la persona recibe aviso), adjuntar fotos y PDF, y grabar **notas de voz** con el micrófono. Los chulitos dicen
si su mensaje se envió (uno), se entregó (dos) o se leyó (dos en verde); en una nota de voz, el micrófono verde indica que
la escucharon. Toque su propio mensaje para ver **a quién se entregó, quién lo vio y quién lo reprodujo**, y quién falta,
con fecha y hora. **Buscar mensajes** busca por palabras o por día en el mini calendario; **Info** muestra multimedia,
archivos, audios, enlaces, fijados y personas de la conversación. Escriba **@Tita** y una pregunta para que Tita
responda en la conversación. En el celular el chat ocupa toda la pantalla.

### Pedidos
Dos pestañas, según su rol. **A proveedores** (administración y bodega): proveedor, productos, cantidades, costo esperado
y fecha de llegada; al llegar la mercancía use **Recibir** e indique por línea lo que llegó, el costo real y el
vencimiento del lote (puede recibir por partes: el pedido queda «parcial»). **De clientes** (administración y secretaria):
los encargos con fecha de entrega; **Registrar la venta** abre el punto de venta con los productos y luego **Marcar
entregado** lo cierra con esa venta. Los atrasados se marcan en rojo y los que vencen en dos días en ámbar; también
llegan a la campana y al calendario.

### Biblioteca
Documentos y enlaces importantes de la tienda, con vista previa en pantalla (PDF, imágenes y texto) sin descargarlos.
Cada documento puede estar limitado a ciertos roles. Solo la administración agrega, edita y elimina.

### Tita
La asistente responde con los datos que su cuenta puede ver y prepara lo que su cuenta puede hacer; nada se registra sin
que usted pulse Confirmar. Ábrala con el orbe flotante, el botón «Tita» de la barra o Ctrl+J. Ver el manual de Tita.

### Mi perfil
Toque su avatar en la barra. Edite nombre, correo y teléfono, suba o quite su **foto**, cambie la contraseña, active los
**avisos en este dispositivo** y elija la **Apariencia** (Claro, Oscuro o Del dispositivo).

## 2. Administrador

Ve todo lo común y además:
- **Lotes y vencimientos**: lotes por producto, por vencer y vencidos (FEFO: se vende primero lo que vence antes).
- **Ventas**: punto de venta (contado o crédito, con cupo del cliente) e historial; puede **anular** ventas.
- **Clientes y cartera**: clientes con saldo, cupo y estado; registrar **abonos**; cartera vencida. Vista en tarjetas,
  lista o tabla. En la ficha del cliente: cartera, **Comentarios** e **Historial**.
- **Proveedores**: compras (también desde la foto de una factura con Tita) y lotes.
- **Finanzas y crédito**: escenarios de ampliación, cuota del crédito, VPN, TIR, sensibilidad y tornado.
- **Reportes**: ventas, inventario y cartera. Cada uno se ve antes de descargar; el PDF lleva **portada**, folio y un
  **QR** que lleva a la verificación de autenticidad (`/verificar/<folio>`), y «Página X de Y». El Excel pregunta dónde
  guardarlo cuando el navegador lo permite. Las gráficas son tocables (abren su detalle) y las leyendas muestran u ocultan
  series. El **historial de reportes** dice quién generó cada archivo, cuándo, con qué filtros y su folio.
- **Contactos del sitio**: mensajes del formulario de la página pública.
- **Nómina**: empleados (cargo, salario base mensual, pago mensual o quincenal) y periodos. Al crear un periodo salen las
  líneas de los empleados activos con el salario prorrateado; en borrador se anotan horas extra, bonificaciones, auxilio
  de transporte (el valor del decreto vigente lo escribe usted) y otros descuentos. El sistema calcula salud y pensión
  del trabajador (4 % cada una) y el neto. Luego **Aprobar** y **Marcar pagado**; el detalle se descarga en Excel. Es una
  liquidación simplificada: no calcula prestaciones ni reemplaza la nómina electrónica de la DIAN.
- **Conteos de inventario**: los mismos que bodega (abajo) y además **Aplicar ajuste**: antes de aplicarlo ve los
  faltantes y sobrantes contra el stock actual; los faltantes se descuentan de los lotes que vencen primero y para cada
  sobrante se indica el vencimiento del lote nuevo.
- **Usuarios y roles**: crear cuentas y ver el equipo. **Auditoría**: todas las escrituras con quién, cuándo y qué cambió;
  desde la ficha de una persona, «Ver actividad» abre su auditoría filtrada.

## 3. Secretaria (caja)

Ve lo común y además:
- **Ventas**: punto de venta (contado o crédito) e historial de ventas.
- **Clientes y cartera**: crear y editar clientes, registrar abonos, ver saldos y cupos, comentarios por cliente.
- **Reportes**: solo el **reporte de ventas** (con portada, QR y su historial propio).
- **Pedidos de clientes**: crear encargos, registrar la venta y marcarlos entregados.
- **Finanzas** aparece con candado: no tiene acceso.
- No ve lotes, proveedores, pedidos a proveedores, nómina, conteos, usuarios ni auditoría. En el calendario ve cobros,
  encargos de clientes, alarmas y cierres.

## 4. Bodega

Ve lo común y además:
- **Lotes y vencimientos**: registrar lotes, ver lo que vence y retirar lo vencido.
- **Proveedores**: registrar compras (también desde la foto de la factura) y crear proveedores.
- **Inventario**: crear y editar productos y categorías.
- **Pedidos a proveedores**: crearlos y recibirlos (el lote y el stock se registran al recibir).
- **Conteos de inventario**: programar un conteo (todo el inventario o una categoría), **Iniciar** (el sistema toma la
  foto del stock), anotar lo contado producto por producto en la hoja (cómoda en el celular; Enter pasa al siguiente),
  **Guardar avance** y **Enviar**. La administración revisa y aplica el ajuste.
- No ve ventas, clientes, cartera, encargos de clientes, reportes, finanzas, nómina, usuarios ni auditoría. En el
  calendario ve lotes, pedidos a proveedores, conteos, alarmas y cierres.

## 5. Qué hacer si algo falla
- «Sin conexión»: la app reintenta sola cuando vuelve la red (los mensajes del chat quedan «en espera» y se reenvían).
- «No tiene permiso para esta acción» (código 613): su rol no puede hacer eso; pídalo a la administración.
- Cualquier otro error muestra un código: repórtelo a la administración con ese código.
