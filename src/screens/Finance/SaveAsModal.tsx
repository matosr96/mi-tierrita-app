import { useState } from "react";
import { Button, Field, Input, Modal } from "@/components/ui";
import { useSaveProjectAs } from "@/hooks/financial";
import { fieldErrors } from "@/lib/errors";
import type { SimulatorInput } from "@/types/api";

type Props = { initialName: string; input: SimulatorInput; onClose: () => void; onSaved: (id: number) => void };

/** «Guardar como»: guarda los supuestos en pantalla como un proyecto nuevo del usuario. */
export const SaveAsModal = ({ initialName, input, onClose, onSaved }: Props) => {
  const [name, setName] = useState(initialName);
  const save = useSaveProjectAs();
  const errors = save.error ? fieldErrors(save.error) : {};
  const submit = () => {
    if (name.trim() === "") return;
    save.mutate({ name: name.trim(), input }, { onSuccess: (p) => onSaved(p.id) });
  };
  return (
    <Modal
      open
      title="Guardar como"
      description="Se crea un proyecto nuevo con los supuestos que está viendo. El original no cambia."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={save.isPending} disabled={name.trim() === ""}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Nombre del proyecto" htmlFor="sim-save-name" error={errors["name"] ?? (save.error && !errors["name"] ? save.error.message : undefined)}>
          <Input id="sim-save-name" value={name} maxLength={160} autoFocus onChange={(e) => setName(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
};
