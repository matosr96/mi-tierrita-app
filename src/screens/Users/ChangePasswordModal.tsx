import { useState, type FormEvent } from "react";
import { useChangePassword } from "@/hooks/users";
import { fieldErrors } from "@/lib/errors";
import { Button, Callout, Field, Input, Modal } from "@/components/ui";
import styles from "./UsersScreen.module.css";

type Props = { onClose: () => void };

/** CU-04 Cambiar la contraseña propia. Cualquier rol puede usarlo. */
export const ChangePasswordModal = ({ onClose }: Props) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const change = useChangePassword();

  const apiErrors = change.error ? fieldErrors(change.error) : {};
  const wrongCurrent = change.error?.code === "610";
  const errs: Record<string, string | undefined> = { ...apiErrors, ...localErrors };
  if (wrongCurrent && !errs.currentPassword) errs.currentPassword = "La contraseña actual no coincide.";
  const general = change.error && !wrongCurrent && Object.keys(apiErrors).length === 0 ? change.error.message : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = "Ingrese su contraseña actual.";
    if (!newPassword) next.newPassword = "Ingrese la nueva contraseña.";
    else if (newPassword === currentPassword) next.newPassword = "La nueva contraseña debe ser distinta de la actual.";
    if (confirm !== newPassword) next.confirm = "Las contraseñas no coinciden.";
    setLocalErrors(next);
    if (Object.keys(next).length > 0) return;
    try {
      await change.mutateAsync({ currentPassword, newPassword });
      onClose();
    } catch {
      /* el error queda en la mutación y se pinta en el formulario */
    }
  };

  return (
    <Modal
      open
      title="Cambiar mi contraseña"
      description="Aplica a su propia cuenta. La sesión actual sigue activa."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={change.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="password-form" loading={change.isPending}>
            Guardar contraseña
          </Button>
        </>
      }
    >
      <form id="password-form" className={styles.form} onSubmit={submit} noValidate>
        {general ? <Callout tone="bad">{general}</Callout> : null}
        <Field label="Contraseña actual" htmlFor="pwd-current" error={errs.currentPassword}>
          <Input id="pwd-current" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} invalid={Boolean(errs.currentPassword)} autoFocus />
        </Field>
        <Field label="Nueva contraseña" htmlFor="pwd-new" error={errs.newPassword}>
          <Input id="pwd-new" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} invalid={Boolean(errs.newPassword)} />
        </Field>
        <Field label="Confirmar nueva contraseña" htmlFor="pwd-confirm" error={errs.confirm}>
          <Input id="pwd-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={Boolean(errs.confirm)} />
        </Field>
      </form>
    </Modal>
  );
};
