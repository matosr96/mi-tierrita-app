import { Button } from "@/components/ui";
import type { Supplier } from "@/types/api";

type Props = { supplier: Supplier; canEdit: boolean; onPurchase: (s: Supplier) => void; onEdit: (s: Supplier) => void; className?: string };

/** Acciones de un proveedor: «Registrar compra» si está activo y «Editar» solo para el Administrador. */
export const SupplierActions = ({ supplier: s, canEdit, onPurchase, onEdit, className }: Props) =>
  s.active || canEdit ? (
    <div className={className}>
      {s.active ? (
        <Button variant="secondary" size="sm" onClick={() => onPurchase(s)} aria-label={`Registrar compra de ${s.name}`}>
          Registrar compra
        </Button>
      ) : null}
      {canEdit ? (
        <Button variant="ghost" size="sm" onClick={() => onEdit(s)} aria-label={`Editar ${s.name}`}>
          Editar
        </Button>
      ) : null}
    </div>
  ) : null;
