/**
 * "Descargar PDF": copia el documento a un contenedor de impresión y abre el diálogo del navegador (allí se elige
 * «Guardar como PDF»). Las reglas de impresión de global.css ocultan todo lo demás. El título de la pestaña se usa
 * como nombre sugerido del archivo.
 */
export const printElement = (el: HTMLElement | null, filename: string): void => {
  if (!el) return;
  const previousTitle = document.title;
  const root = document.createElement("div");
  root.id = "print-root";
  root.appendChild(el.cloneNode(true));
  document.body.appendChild(root);
  document.title = filename.replace(/\.pdf$/i, "");
  document.documentElement.dataset.printing = "1";
  const cleanup = () => {
    root.remove();
    delete document.documentElement.dataset.printing;
    document.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
};
