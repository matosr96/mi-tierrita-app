import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSignin } from "@/hooks/session";
import { BrandMark } from "@/components/layout/AppShell";
import { Button, Callout, Field, Input } from "@/components/ui";
import styles from "./SigninScreen.module.css";

const Eye = ({ off }: { off: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 20" fill="none" aria-hidden="true">
    <path d="M1.8 10 C 4.9 5.2 8.5 3 12 3 C 15.5 3 19.1 5.2 22.2 10 C 19.1 14.8 15.5 17 12 17 C 8.5 17 4.9 14.8 1.8 10 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="3.1" stroke="currentColor" strokeWidth="1.5" />
    {off ? <line x1="3.4" y1="1.6" x2="20.6" y2="18.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /> : null}
  </svg>
);

/** Título del aviso según el código de la API; el detalle es el mensaje traducido de `toApiError`. */
const errorTitle = (code: string) => {
  if (code === "610") return "No pudimos iniciar sesión";
  if (code === "612") return "Usuario inactivo";
  if (code === "640") return "Demasiados intentos";
  if (code === "network") return "Sin conexión";
  return "No pudimos iniciar sesión";
};

/** CU-01 Iniciar sesión: marca y propósito a la izquierda, formulario a la derecha. Al entrar navega de inmediato. */
export const SigninScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const signin = useSignin();
  const navigate = useNavigate();
  const location = useLocation();

  const watchCaps = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.("CapsLock") ?? false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (signin.isPending) return;
    signin.mutate(
      { username, password },
      { onSuccess: () => navigate((location.state as { from?: string } | null)?.from ?? "/", { replace: true }) },
    );
  };

  const error = signin.isError ? signin.error : null;
  const credentialsError = error?.code === "610";

  return (
    <div className={styles.page}>
      <aside className={styles.brandSide}>
        <div className={styles.brand}>
          <BrandMark size={32} />
          <div>
            <div className={styles.brandName}>Mi Tierrita SIG</div>
            <div className={styles.brandSub}>Agropecuaria · Sahagún</div>
          </div>
        </div>
        <p className={styles.pitch}>Inventario, ventas, cartera y evaluación de inversiones de la tienda en un solo lugar.</p>
        <p className={styles.credit}>Trabajo Colaborativo Contextualizado · Ingeniería de Software · Universidad de Cartagena</p>
      </aside>

      <main className={styles.formSide}>
        <form className={styles.card} onSubmit={submit}>
          <div className={styles.head}>
            <h1 className={styles.title}>Iniciar sesión</h1>
            <p className={styles.lead}>Use el usuario que le asignó el administrador.</p>
          </div>

          <div aria-live="polite" className={styles.alert}>
            {error ? (
              <div id="signin-error">
                <Callout tone={error.code === "640" ? "warn" : "bad"} mark={false} title={errorTitle(error.code)}>
                  {error.message}
                </Callout>
              </div>
            ) : null}
          </div>

          <Field label="Usuario" htmlFor="username">
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              invalid={credentialsError}
              aria-describedby={error ? "signin-error" : undefined}
              required
              autoFocus
            />
          </Field>

          <Field label="Contraseña" htmlFor="password">
            <div className={styles.passwordWrap}>
              <Input
                id="password"
                name="password"
                className={styles.passwordInput}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={watchCaps}
                onKeyUp={watchCaps}
                onBlur={() => setCapsLock(false)}
                invalid={credentialsError}
                aria-describedby={[error ? "signin-error" : "", capsLock ? "signin-caps" : ""].filter(Boolean).join(" ") || undefined}
                required
              />
              <button
                type="button"
                className={styles.eye}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                aria-controls="password"
              >
                <Eye off={showPassword} />
              </button>
            </div>
          </Field>
          {capsLock ? (
            <p id="signin-caps" className={styles.caps}>
              Bloq Mayús está activado.
            </p>
          ) : null}

          <Button type="submit" size="lg" block loading={signin.isPending}>
            Iniciar sesión
          </Button>

          <p className={styles.help}>¿Olvidó su contraseña? Pídale al administrador que la restablezca desde Usuarios y roles.</p>
        </form>
        <p className={styles.creditMobile}>Trabajo Colaborativo Contextualizado · Ingeniería de Software · Universidad de Cartagena</p>
      </main>
    </div>
  );
};
