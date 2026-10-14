import { useEffect, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSignin } from "@/hooks/session";
import { BrandMark } from "@/components/layout/AppShell";
import { SplitText, TerrainField, type TerrainPhase } from "@/components/motion";
import { LoginCursor } from "./LoginCursor";
import styles from "./SigninScreen.module.css";

const Eye = ({ off }: { off: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 20" fill="none" aria-hidden="true">
    <path d="M1.8 10 C 4.9 5.2 8.5 3 12 3 C 15.5 3 19.1 5.2 22.2 10 C 19.1 14.8 15.5 17 12 17 C 8.5 17 4.9 14.8 1.8 10 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="3.1" stroke="currentColor" strokeWidth="1.5" />
    {off ? <line x1="3.4" y1="1.6" x2="20.6" y2="18.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /> : null}
  </svg>
);

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4 10 H15.5 M11 5.5 L15.5 10 L11 14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Check = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4.5 10.5 L8.5 14.5 L15.5 6" pathLength={1} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MODULES = ["Inventario", "Lotes y vencimientos", "Ventas", "Clientes y cartera", "Proveedores", "Evaluación de inversiones", "Reportes", "Auditoría"];
const INDEX = ["Inventario", "Ventas", "Cartera", "Inversión"];

const clock = () => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const dateLine = () => new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });

/** CU-01 Iniciar sesión: portada con terreno en malla de alambre, formulario de vidrio y salida en vuelo. */
export const SigninScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [now, setNow] = useState(clock);
  const [phase, setPhase] = useState<TerrainPhase>("idle");
  const [shake, setShake] = useState(0);
  const signin = useSignin();
  const navigate = useNavigate();
  const location = useLocation();
  const leaving = phase === "leaving";

  useEffect(() => {
    const id = window.setInterval(() => setNow(clock()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // El resplandor sigue al cursor.
  const follow = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--mx", `${e.clientX}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY}px`);
  };

  const watchCaps = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.("CapsLock") ?? false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (leaving) return;
    await signin.mutateAsync({ username, password }).then(
      () => {
        // Vuelo de salida antes de entrar al sistema (sin espera si el usuario pidió reducir el movimiento).
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        setPhase("leaving");
        window.setTimeout(() => navigate((location.state as { from?: string } | null)?.from ?? "/", { replace: true }), reduced ? 0 : 1100);
      },
      () => setShake((n) => n + 1),
    );
  };

  const filled = (username ? 1 : 0) + (password ? 1 : 0);

  return (
    <div className={[styles.page, leaving ? styles.leaving : ""].join(" ")} onPointerMove={follow}>
      <div className={styles.bg} aria-hidden="true">
        <TerrainField className={styles.terrain} phase={phase} alert={shake} />
        <div className={styles.vignette} />
        <div className={styles.spot} />
        <div className={styles.grain} />
      </div>
      <LoginCursor />
      <div className={styles.flash} aria-hidden="true" />

      <div className={styles.frame}>
        <span className={[styles.corner, styles.tl].join(" ")} aria-hidden="true" />
        <span className={[styles.corner, styles.tr].join(" ")} aria-hidden="true" />
        <span className={[styles.corner, styles.bl].join(" ")} aria-hidden="true" />
        <span className={[styles.corner, styles.br].join(" ")} aria-hidden="true" />

        <header className={styles.top}>
          <div className={styles.brand}>
            <BrandMark size={34} />
            <div>
              <div className={styles.brandName}>Mi Tierrita</div>
              <div className={styles.brandSub}>Agropecuaria · Sahagún</div>
            </div>
          </div>
          <ol className={styles.index} aria-label="Módulos del sistema">
            {INDEX.map((m, i) => (
              <li key={m} style={{ animationDelay: `${300 + i * 60}ms` }}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {m}
              </li>
            ))}
          </ol>
          <div className={styles.clock}>
            <span className={styles.live} aria-hidden="true" />
            <span>{now}</span>
          </div>
        </header>

        <div className={styles.body}>
          <section className={styles.hero}>
            <div className={styles.eyebrow}>
              <span>01</span>
              <span className={styles.rule} />
              Sistema de gestión · Sahagún, Córdoba
            </div>
            <h1 className={styles.headline}>
              <SplitText text={"Cada lote,\ncada venta,\n*a la vista.*"} delay={350} stagger={80} />
            </h1>
            <p className={styles.lead}>Inventario, cartera y evaluación de inversiones en un solo lugar: calcula si un crédito crea valor y si el negocio puede pagar la cuota, con los supuestos a la vista.</p>

            <div className={styles.signal}>
              <div className={styles.signalHead}>
                <span className={styles.signalTag}>
                  <span className={styles.live} aria-hidden="true" />
                  Señal en vivo
                </span>
                <span className={styles.signalBars} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <dl className={styles.signalGrid}>
                <div>
                  <dt>Hora local</dt>
                  <dd>{now}</dd>
                </div>
                <div>
                  <dt>Hoy</dt>
                  <dd>{dateLine()}</dd>
                </div>
                <div>
                  <dt>Coordenadas</dt>
                  <dd>8.95° N · 75.44° O</dd>
                </div>
                <div>
                  <dt>Acceso por rol</dt>
                  <dd>Administración · Secretaría · Bodega</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className={styles.formSide}>
            <form className={[styles.form, shake === 0 ? "" : shake % 2 ? styles.shakeA : styles.shakeB].join(" ")} onSubmit={submit}>
              <div className={styles.formHead}>
                <span className={styles.formTag}>Sesión segura</span>
                <span className={styles.steps} aria-hidden="true">
                  <span className={styles.stepsFill} style={{ transform: `scaleX(${filled / 2})` }} />
                </span>
              </div>
              <h2 className={styles.formTitle}>
                Iniciar <em>sesión</em>
              </h2>
              <p className={styles.formLead}>Use el usuario que le asignó el administrador.</p>

              <div className={styles.float}>
                <input id="username" autoComplete="username" placeholder=" " value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus disabled={leaving} />
                <label htmlFor="username">Usuario</label>
                <i className={styles.fieldLine} aria-hidden="true" />
              </div>

              <div className={[styles.float, signin.isError ? styles.floatError : ""].join(" ")}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={watchCaps}
                  onKeyUp={watchCaps}
                  onBlur={() => setCapsLock(false)}
                  aria-invalid={signin.isError}
                  aria-describedby={signin.isError ? "signin-error" : undefined}
                  required
                  disabled={leaving}
                />
                <label htmlFor="password">Contraseña</label>
                <i className={styles.fieldLine} aria-hidden="true" />
                <button type="button" className={styles.eye} onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  <Eye off={showPassword} />
                </button>
              </div>

              <div className={styles.messages} aria-live="polite">
                {signin.isError ? (
                  <span id="signin-error" className={styles.error}>
                    {signin.error?.message}
                  </span>
                ) : null}
                {capsLock ? <span className={styles.caps}>Bloq Mayús está activado</span> : null}
              </div>

              <button type="submit" className={[styles.submit, leaving ? styles.submitDone : ""].join(" ")} disabled={signin.isPending || leaving}>
                <span className={styles.submitFill} aria-hidden="true" />
                <span className={styles.submitLabel}>{leaving ? "Entrando" : signin.isPending ? "Verificando" : "Entrar al sistema"}</span>
                <span className={styles.submitIcon}>{leaving ? <Check /> : signin.isPending ? <span className={styles.spinner} /> : <Arrow />}</span>
              </button>

              <p className={styles.help}>¿Olvidó su contraseña? Pídale al administrador que la restablezca desde Usuarios y roles.</p>
            </form>
          </section>
        </div>

        <footer className={styles.foot}>
          <div className={styles.marquee} aria-hidden="true">
            <div className={styles.marqueeTrack}>
              {[0, 1].map((copy) => (
                <span key={copy} className={styles.marqueeGroup}>
                  {MODULES.map((m) => (
                    <span key={m}>
                      {m}
                      <i>✳</i>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.footLine}>
            <span>© {new Date().getFullYear()} Mi Tierrita SIG</span>
            <span>Ingeniería Económica · Evaluación de inversiones</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
