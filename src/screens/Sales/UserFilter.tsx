import { useUsers } from "@/hooks/users";
import { Field, Select } from "@/components/ui";

/** Filtro por vendedor del historial. Solo lo monta ADMIN: GET /users no está permitido para SALES. */
export const UserFilter = ({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) => {
  const users = useUsers({ limit: 100 });
  return (
    <Field label="Vendedor" htmlFor="sales-user" hint={users.isError ? "No se pudo cargar la lista de usuarios." : undefined}>
      <Select id="sales-user" value={value ?? ""} disabled={!users.data} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}>
        <option value="">{users.isPending ? "Cargando…" : "Todos"}</option>
        {users.data?.items.map((u) => (
          <option key={u.id} value={u.id}>
            {u.firstName} {u.lastName} ({u.username})
          </option>
        ))}
      </Select>
    </Field>
  );
};
