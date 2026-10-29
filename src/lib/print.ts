/**
 * "Descargar PDF": copia el documento (o varios, por ejemplo la portada y la hoja) a un contenedor de impresión y abre
 * el diálogo del navegador (allí se elige «Guardar como PDF» y la carpeta). Las reglas de impresión de global.css
 * ocultan todo lo demás. El título de la pestaña se usa como nombre sugerido del archivo. Los elementos que en pantalla
 * están `hidden` (la portada) se muestran en la copia.
 */
export const printElement = (el: HTMLElement | null | (HTMLElement | null)[], filename: string): void => {
  const elements = (Array.isArray(el) ? el : [el]).filter((e): e is HTMLElement => e !== null);
  if (elements.length === 0) return;
  const previousTitle = document.title;
  const root = document.createElement("div");
  root.id = "print-root";
  for (const e of elements) {
    const copy = e.cloneNode(true) as HTMLElement;
    copy.removeAttribute("hidden");
    root.appendChild(copy);
  }
  document.body.appendChild(root);
  document.title = filename.replace(/\.pdf$/i, "");
  document.documentElement.dataset.printing = "1";
  // El papel siempre sale en el tema claro, aunque la persona use el oscuro en pantalla.
  const previousTheme = document.documentElement.dataset["theme"];
  document.documentElement.dataset["theme"] = "light";
  const cleanup = () => {
    root.remove();
    delete document.documentElement.dataset.printing;
    if (previousTheme === undefined) delete document.documentElement.dataset["theme"];
    else document.documentElement.dataset["theme"] = previousTheme;
    document.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
};
