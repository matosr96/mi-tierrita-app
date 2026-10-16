import { useState, type FormEvent } from "react";
import { useChangePassword } from "@/hooks/users";
import { fieldErrors } from "@/lib/errors";
import { Button, Callout, Checkbox, Field, FieldRow, Input } from "@/components/ui";
import styles from "./ProfileScreen.module.css";

const MIN_LENGTH = 8;

/** CU-04 en la pestaña Seguridad de Mi perfil: cambiar la contraseña propia, con la lista de requisitos a la vista. */
export const PasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const change = useChangePassword();

  const apiErrors = change.error ? fieldErrors(change.error) : {};
  const wrongCurrent = change.error?.code === "610";
  const errs: Record<string, string | undefined> = { ...apiErrors, ...localErrors };
  if (wrongCurrent && !errs.currentPassword) errs.currentPassword = "La contraseña actual no coincide.";
  const general = change.error && !wrongCurrent && Object.keys(apiErrors).length === 0 ? change.error.message : undefined;

  const rules = [
    { ok: newPassword.length >= MIN_LENGTH, text: `Al menos ${MIN_LENGTH} caracteres` },
    { ok: newPassword.length > 0 && newPassword !== currentPassword, text: "Distinta de la actual" },
    { ok: confirm.length > 0 && confirm === newPassword, text: "La confirmación coincide" },
  ];

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
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      change.reset();
    } catch {
      /* el error queda en la mutación y se pinta en el formulario */
    }
  };

  const type = show ? "text" : "password";
  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {general ? <Callout tone="bad">{general}</Callout> : null}
      <Field label="Contraseña actual" htmlFor="pf-current" error={errs.currentPassword}>
        <Input id="pf-current" type={type} autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} invalid={Boolean(errs.currentPassword)} />
      </Field>
      <FieldRow>
        <Field label="Nueva contraseña" htmlFor="pf-new" error={errs.newPassword}>
          <Input id="pf-new" type={type} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} invalid={Boolean(errs.newPassword)} />
        </Field>
        <Field label="Confirmar nueva contraseña" htmlFor="pf-confirm" error={errs.confirm}>
          <Input id="pf-confirm" type={type} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={Boolean(errs.confirm)} />
        </Field>
      </FieldRow>
      <ul className={styles.rules} aria-label="Requisitos de la nueva contraseña">
        {rules.map((r) => (
          <li key={r.text} className={r.ok ? styles.ruleOk : ""}>
            <span aria-hidden="true">{r.ok ? "✓" : "·"}</span>
            {r.text}
          </li>
        ))}
      </ul>
      <div className={styles.formFoot}>
        <Checkbox label="Mostrar contraseñas" checked={show} onChange={(e) => setShow(e.target.checked)} />
        <Button type="submit" loading={change.isPending}>
          Actualizar contraseña
        </Button>
      </div>
    </form>
  );
};
