import { Button, DataTable, Modal, type Column } from "@/components/ui";
import { downloadXlsx, type XlsxSheet } from "@/lib/xlsx";

type Props<T> = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string | undefined;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: ((row: T) => void) | undefined;
  /** Hoja de Excel con ese mismo detalle (solo las filas que devolvió la API). */
  excel?: { filename: string; sheet: XlsxSheet } | undefined;
};

/** Detalle de la gráfica tocada: la tabla con sus filas y «Descargar Excel» de ese detalle. */
export const ChartDetailModal = <T,>({ open, onClose, title, description, columns, rows, rowKey, onRowClick, excel }: Props<T>) => (
  <Modal
    open={open}
    title={title}
    description={description}
    onClose={onClose}
    wide
    footer={
      <>
        {excel ? (
          <Button variant="secondary" onClick={() => void downloadXlsx(excel.filename, [excel.sheet])} title="Guardar como: elija la carpeta y el nombre del libro .xlsx">
            Descargar Excel
          </Button>
        ) : null}
        <Button variant="primary" onClick={onClose}>
          Cerrar
        </Button>
      </>
    }
  >
    <DataTable columns={columns} rows={rows} rowKey={rowKey} onRowClick={onRowClick} />
  </Modal>
);
