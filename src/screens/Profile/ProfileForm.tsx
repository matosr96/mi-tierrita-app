import { useState, type FormEvent } from "react";
import { useUpdateProfile } from "@/hooks/users";
import { fieldErrors } from "@/lib/errors";
import { Button, Callout, Field, FieldRow, Input } from "@/components/ui";
import { ROLE_LABELS } from "@/stores/session";
import type { UpdateProfileInput, User } from "@/types/api";
import styles from "./ProfileScreen.module.css";

/** Mi perfil · Datos personales (prototipo 15): nombre, correo y teléfono propios. Usuario y rol los cambia el administrador. */
export const ProfileForm = ({ user }: { user: User }) => {
  const initial = { firstName: user.firstName, lastName: user.lastName, email: user.email ?? "", phone: user.phone ?? "" };
  const [form, setForm] = useState(initial);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const update = useUpdateProfile();
  const dirty = (Object.keys(initial) as (keyof typeof initial)[]).some((k) => form[k].trim() !== initial[k]);
  const errs: Record<string, string | undefined> = { ...(update.error ? fieldErrors(update.error) : {}), ...localErrors };
  const general = update.error && Object.keys(fieldErrors(update.error)).length === 0 ? update.error.message : undefined;
  const set = (k: keyof typeof initial) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Ingrese su nombre.";
    if (!form.lastName.trim()) next.lastName = "Ingrese su apellido.";
    setLocalErrors(next);
    if (Object.keys(next).length > 0) return;
    try {
      // Solo viajan los campos que la persona cambió.
      const changed: UpdateProfileInput = {};
      if (form.firstName.trim() !== initial.firstName) changed.firstName = form.firstName.trim();
      if (form.lastName.trim() !== initial.lastName) changed.lastName = form.lastName.trim();
      if (form.email.trim() !== initial.email) changed.email = form.email.trim() || null;
      if (form.phone.trim() !== initial.phone) changed.phone = form.phone.trim() || null;
      const saved = await update.mutateAsync(changed);
      setForm({ firstName: saved.firstName, lastName: saved.lastName, email: saved.email ?? "", phone: saved.phone ?? "" });
    } catch {
      /* el error queda en la mutación y se pinta en el formulario */
    }
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {general ? <Callout tone="bad">{general}</Callout> : null}
      <FieldRow>
        <Field label="Nombre" htmlFor="pf-first" error={errs.firstName}>
          <Input id="pf-first" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" invalid={Boolean(errs.firstName)} />
        </Field>
        <Field label="Apellido" htmlFor="pf-last" error={errs.lastName}>
          <Input id="pf-last" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" invalid={Boolean(errs.lastName)} />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Correo electrónico" htmlFor="pf-email" hint="Opcional · solo lo ve el equipo" error={errs.email}>
          <Input id="pf-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" invalid={Boolean(errs.email)} />
        </Field>
        <Field label="Teléfono" htmlFor="pf-phone" hint="Opcional · números, espacios, + y guiones" error={errs.phone}>
          <Input id="pf-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" invalid={Boolean(errs.phone)} />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Usuario" htmlFor="pf-user" hint="Solo lo cambia el administrador">
          <Input id="pf-user" value={user.username} readOnly />
        </Field>
        <Field label="Rol" htmlFor="pf-role" hint="Solo lo cambia el administrador">
          <Input id="pf-role" value={ROLE_LABELS[user.role]} readOnly />
        </Field>
      </FieldRow>
      <div className={styles.formFoot}>
        <span className={styles.note}>Su nombre aparece en las ventas, el chat y el encabezado de los reportes.</span>
        <div className={styles.formActions}>
          <Button type="button" variant="ghost" disabled={!dirty || update.isPending} onClick={() => setForm(initial)}>
            Descartar
          </Button>
          <Button type="submit" loading={update.isPending} disabled={!dirty}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </form>
  );
};
