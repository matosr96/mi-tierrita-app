# 8. Evaluación final

Valoración del sistema después de las correcciones. Cada valoración se apoya en lo que se probó (ver
[06-pruebas-verificacion.md](06-pruebas-verificacion.md)), no en la lectura del código.

| Dimensión | Antes | Después | Base de la valoración |
|---|---|---|---|
| Pertinencia de los elementos | Media: bloques que repetían datos en los Inicios y en Lotes | Buena | 6 bloques redundantes quitados sin perder información (R-01 a R-07) |
| Arquitectura de información | Buena | Buena | Navegación por rol coherente con la API; no requirió reorganizar |
| Coherencia de reglas de negocio | Media: stock vencido como disponible, lotes vencidos aceptados, fechas en UTC | Buena | N-01 a N-13; queda la definición de "sin existencias" (P-05) |
| Funcionamiento | Bueno con un fallo de flujo en el punto de venta | Bueno | 102 cargas de página sin errores de red ni de consola; I-01 corregido |
| Permisos | Buenos | Buenos, con una diferencia documentada | Matriz completa por rol; P-02 abierto |
| Diseño adaptable | Media: 3 pantallas desbordaban en móvil | Buena | 0 px de desborde en 17 rutas × 3 roles a 375 px |
| Consistencia visual | Media: pestañas distintas, candado invisible, texto ilegible, decoración encima del texto | Buena | AUD-07, 08, 15, 20, 22 |
| Accesibilidad | Media: diálogos sin foco, rol ARIA mal aplicado | Buena en lo medido | AUD-18 y 19; recorrido sin botones sin nombre ni campos sin etiqueta. No se hizo una prueba con lector de pantalla real |
| Gestión de cuentas | **Insuficiente**: no se puede desactivar a nadie | Igual | P-01, pendiente de diseño |
| Mantenibilidad | Media: código muerto y duplicado | Mejor | 6 archivos eliminados, constante única, un solo componente de pestañas y de contraseña |

## Conclusión

El sistema hace bien lo central: vende con FEFO, cuida el cupo y la cartera, separa lo que ve cada rol y deja rastro
de cada escritura. Tras la auditoría:

- **Fechas.** Se cuentan en la hora de la tienda.
- **Disponibilidad.** El punto de venta y el inventario dicen la verdad sobre qué se puede vender.
- **Pantallas.** Los Inicios muestran cada dato una sola vez.
- **Diseño adaptable y accesibilidad.** Las pantallas funcionan en móvil y los diálogos se pueden usar con teclado.

Antes de dar el sistema por terminado, falta decidir y construir la **desactivación de cuentas** (P-01). Es la única
carencia con efecto de seguridad que encontró la auditoría.
