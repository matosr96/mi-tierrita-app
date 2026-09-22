import { useState, type FormEvent } from "react";
import { useCreateUser } from "@/hooks/users";
import { ROLE_LABELS } from "@/stores/session";
import { fieldErrors } from "@/lib/errors";
import { Button, Callout, Field, FieldRow, Input, Modal, Select } from "@/components/ui";
import type { Role } from "@/types/api";
import styles from "./UsersScreen.module.css";

const ROLES: Role[] = ["ADMIN", "SALES", "WAREHOUSE"];

type Props = { onClose: () => void };

/** CU-03 Crear usuario. Se monta solo mientras está abierto. */
export const UserFormModal = ({ onClose }: Props) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("SALES");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const create = useCreateUser();

  const apiErrors = create.error ? fieldErrors(create.error) : {};
  const duplicate = create.error?.code === "630";
  const errs: Record<string, string | undefined> = { ...apiErrors, ...localErrors };
  if (duplicate && !errs.username) errs.username = "Ya existe un usuario con ese nombre de usuario.";
  const general = create.error && !duplicate && Object.keys(apiErrors).length === 0 ? create.error.message : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "El nombre es obligatorio.";
    if (!lastName.trim()) next.lastName = "El apellido es obligatorio.";
    if (!username.trim()) next.username = "El usuario es obligatorio.";
    if (!password) next.password = "La contraseña inicial es obligatoria.";
    setLocalErrors(next);
    if (Object.keys(next).length > 0) return;
    try {
      await create.mutateAsync({ firstName: firstName.trim(), lastName: lastName.trim(), username: username.trim().toLowerCase(), password, role });
      onClose();
    } catch {
      /* el error queda en la mutación y se pinta en el formulario */
    }
  };

  return (
    <Modal
      open
      title="Nuevo usuario"
      description="La persona entrará con esta contraseña inicial y podrá cambiarla desde su sesión."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="user-form" loading={create.isPending}>
            Crear usuario
          </Button>
        </>
      }
    >
      <form id="user-form" className={styles.form} onSubmit={submit} noValidate>
        {general ? <Callout tone="bad">{general}</Callout> : null}
        <FieldRow>
          <Field label="Nombre" htmlFor="user-first" error={errs.firstName}>
            <Input id="user-first" autoComplete="off" value={firstName} onChange={(e) => setFirstName(e.target.value)} invalid={Boolean(errs.firstName)} autoFocus maxLength={60} />
          </Field>
          <Field label="Apellido" htmlFor="user-last" error={errs.lastName}>
            <Input id="user-last" autoComplete="off" value={lastName} onChange={(e) => setLastName(e.target.value)} invalid={Boolean(errs.lastName)} maxLength={60} />
          </Field>
        </FieldRow>
        <Field label="Usuario" htmlFor="user-username" hint="Con el que iniciará sesión; se guarda en minúsculas." error={errs.username}>
          <Input id="user-username" autoComplete="off" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} invalid={Boolean(errs.username)} maxLength={40} />
        </Field>
        <Field label="Contraseña inicial" htmlFor="user-password" error={errs.password}>
          <div className={styles.passwordWrap}>
            <Input id="user-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={Boolean(errs.password)} />
            <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword((v) => !v)} aria-label="Mostrar contraseña">
              {showPassword ? "Ocultar" : "Ver"}
            </button>
          </div>
        </Field>
        <Field label="Rol" htmlFor="user-role" error={errs.role}>
          <Select id="user-role" value={role} onChange={(e) => setRole(e.target.value as Role)} invalid={Boolean(errs.role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
};
