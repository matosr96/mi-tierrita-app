/** Exportación CSV en el cliente: solo serializa las filas que devolvió la API, no calcula nada. */
type Cell = string | number | null | undefined;

const escapeCell = (value: Cell): string => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Genera el archivo con separador «;» (el que Excel en es-CO reconoce) y BOM para los acentos. */
export const downloadCsv = (filename: string, headers: string[], rows: Cell[][]): void => {
  const content = [headers, ...rows].map((row) => row.map(escapeCell).join(";")).join("\r\n");
  const blob = new Blob([`﻿${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
