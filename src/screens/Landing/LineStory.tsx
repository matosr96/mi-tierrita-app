import type { CSSProperties, ReactElement } from "react";
import styles from "./LineStory.module.css";

/** Los tres pasos que cuenta cada animación (se muestran sincronizados bajo la escena). */
export const STORY_STEPS: Record<string, [string, string, string]> = {
  "01": ["Se abre el saco", "Se sirve la ración", "Comedero lleno"],
  "02": ["Se toma la dosis", "Se aplica", "Lote y vencimiento registrados"],
  "03": ["Se siembra", "Se riega y abona", "Brota la mata"],
  "04": ["El huevo se mueve", "Se agrieta", "Nace el pollito"],
  "05": ["Plaga en la hoja", "Aspersión", "Hoja sana"],
  "06": ["Se clavan los postes", "Se tiende el alambre", "Cerca lista"],
};

const d = (i: number) => ({ "--i": i }) as CSSProperties;

const Feed = () => (
  <>
    {/* comedero */}
    <path className={styles.line} d="M196 150 L206 178 L326 178 L336 150" />
    <rect className={styles.fillUp} x="208" y="152" width="116" height="24" rx="3" />
    {/* saco que se inclina */}
    <g className={styles.sack}>
      <path className={styles.lineFill} d="M96 40 Q92 34 100 30 L168 30 Q176 34 172 40 L176 128 Q176 138 166 138 L102 138 Q92 138 92 128 Z" />
      <path className={styles.lineSoft} d="M104 44 L164 44" />
      <text x="134" y="98" className={styles.label} textAnchor="middle">
        40 kg
      </text>
    </g>
    {/* concentrado cayendo */}
    {Array.from({ length: 14 }, (_, i) => (
      <circle key={i} className={styles.pellet} cx={186 + (i % 4) * 7} cy="58" r="3.4" style={d(i)} />
    ))}
  </>
);

const Vet = () => (
  <>
    {/* frasco */}
    <rect className={styles.lineFill} x="300" y="40" width="40" height="58" rx="7" />
    <rect className={styles.lineSoft} x="308" y="30" width="24" height="10" rx="2" />
    <rect className={styles.vialLiquid} x="304" y="62" width="32" height="32" rx="4" />
    {/* jeringa */}
    <g className={styles.syringe}>
      <rect className={styles.line} x="120" y="58" width="130" height="26" rx="5" />
      <rect className={styles.syringeLiquid} x="124" y="62" width="122" height="18" rx="3" />
      <path className={styles.line} d="M250 71 L292 71" />
      <g className={styles.plunger}>
        <path className={styles.line} d="M118 71 L70 71 M70 58 L70 84" />
      </g>
      {[150, 180, 210].map((x) => (
        <path key={x} className={styles.lineSoft} d={`M${x} 58 L${x} 66`} />
      ))}
    </g>
    {/* pulso */}
    <path className={styles.ecg} pathLength={1} d="M30 150 L120 150 L135 150 L145 122 L157 176 L169 138 L178 150 L240 150 L252 150 L262 126 L273 172 L284 142 L292 150 L370 150" />
    <g className={styles.tag}>
      <rect className={styles.tagBox} x="262" y="190" width="112" height="28" rx="14" />
      <text x="318" y="208" className={styles.tagText} textAnchor="middle">
        LOTE 24 · VENCE 12/26
      </text>
    </g>
  </>
);

const Seeds = () => (
  <>
    <g className={styles.sun}>
      <circle className={styles.sunDisk} cx="300" cy="70" r="22" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} className={styles.lineSoft} d="M300 36 L300 28" transform={`rotate(${i * 45} 300 70)`} />
      ))}
    </g>
    {/* suelo */}
    <path className={styles.ground} d="M40 168 Q120 160 200 168 T360 166 L360 200 L40 200 Z" />
    <path className={styles.line} d="M40 168 Q120 160 200 168 T360 166" />
    {/* lluvia y abono */}
    {Array.from({ length: 7 }, (_, i) => (
      <path key={i} className={styles.drop} d={`M${150 + i * 16} 40 l0 10`} style={d(i)} />
    ))}
    <ellipse className={styles.seed} cx="200" cy="40" rx="6" ry="4.5" />
    {/* la mata */}
    <path className={styles.stem} pathLength={1} d="M200 166 C 200 140 202 110 200 72" />
    <path className={[styles.leaf, styles.leafA].join(" ")} pathLength={1} d="M201 136 C 222 128 238 112 244 98 C 226 104 210 116 201 136 Z" />
    <path className={[styles.leaf, styles.leafB].join(" ")} pathLength={1} d="M200 116 C 178 108 164 92 160 78 C 178 84 192 96 200 116 Z" />
    <path className={[styles.leaf, styles.leafC].join(" ")} pathLength={1} d="M201 96 C 216 86 226 72 228 58 C 214 66 205 80 201 96 Z" />
  </>
);

const Chicks = () => (
  <>
    <path className={styles.lineSoft} d="M90 186 Q200 176 310 186" />
    {/* pollito */}
    <g className={styles.chick}>
      <circle className={styles.chickBody} cx="200" cy="112" r="26" />
      <circle className={styles.eye} cx="209" cy="106" r="3" />
      <path className={styles.beak} d="M224 112 L236 116 L224 120 Z" />
    </g>
    {/* cáscara de abajo (queda) */}
    <g className={styles.egg}>
      <path className={styles.shell} d="M156 128 L170 118 L184 130 L198 116 L212 130 L226 118 L244 128 C 246 160 228 184 200 184 C 172 184 154 160 156 128 Z" />
      {/* cáscara de arriba (salta) */}
      <path className={[styles.shell, styles.shellTop].join(" ")} d="M156 128 C 156 86 178 60 200 60 C 222 60 244 86 244 128 L226 118 L212 130 L198 116 L184 130 L170 118 Z" />
      <path className={styles.crack} pathLength={1} d="M156 128 L170 118 L184 130 L198 116 L212 130 L226 118 L244 128" />
    </g>
    <path className={styles.peep} d="M246 78 l12 -8 M250 92 l14 -2" />
  </>
);

const Agro = () => (
  <>
    {/* hoja */}
    <path className={styles.leafBig} d="M110 170 C 120 100 190 60 300 64 C 296 150 230 190 110 170 Z" />
    <path className={styles.lineSoft} d="M110 170 C 170 140 230 106 300 64 M170 140 L160 110 M210 118 L206 86 M240 98 L262 92" />
    {/* plaga */}
    <g className={styles.bug}>
      <ellipse className={styles.bugBody} cx="220" cy="116" rx="12" ry="9" />
      <path className={styles.bugLegs} d="M210 110 l-8 -6 M210 122 l-8 6 M230 110 l8 -6 M230 122 l8 6 M220 107 l0 -8" />
    </g>
    {/* boquilla y rocío */}
    <g className={styles.nozzle}>
      <path className={styles.line} d="M30 30 L70 52 M64 44 L80 58 L72 64 L58 52 Z" />
      {Array.from({ length: 18 }, (_, i) => (
        <circle key={i} className={styles.mist} cx="80" cy="60" r="2.2" style={{ ...d(i), "--dx": `${70 + (i % 6) * 26}px`, "--dy": `${30 + Math.floor(i / 6) * 22}px` } as CSSProperties} />
      ))}
    </g>
    <g className={styles.shield}>
      <path className={styles.shieldPath} d="M330 150 L352 158 L352 178 C 352 192 342 200 330 204 C 318 200 308 192 308 178 L308 158 Z" />
      <path className={styles.check} pathLength={1} d="M320 178 L328 186 L342 170" />
    </g>
  </>
);

const Tools = () => (
  <>
    <path className={styles.lineSoft} d="M40 186 L360 186" />
    {/* postes que entran */}
    <rect className={[styles.post, styles.postA].join(" ")} x="84" y="74" width="16" height="112" rx="3" />
    <rect className={[styles.post, styles.postB].join(" ")} x="300" y="74" width="16" height="112" rx="3" />
    {/* alambre */}
    <path className={[styles.wire, styles.wireA].join(" ")} pathLength={1} d="M100 100 Q200 108 300 100" />
    <path className={[styles.wire, styles.wireB].join(" ")} pathLength={1} d="M100 140 Q200 148 300 140" />
    {[130, 165, 200, 235, 270].map((x, i) => (
      <path key={x} className={styles.barb} d={`M${x - 6} ${100 + 6} l12 -12 M${x - 6} ${100 - 6} l12 12`} style={d(i)} />
    ))}
    {[130, 165, 200, 235, 270].map((x, i) => (
      <path key={`b${x}`} className={styles.barb} d={`M${x - 6} ${141 + 6} l12 -12 M${x - 6} ${141 - 6} l12 12`} style={d(i + 5)} />
    ))}
    {/* mazo */}
    <g className={styles.mallet}>
      <rect className={styles.lineFill} x="58" y="40" width="40" height="22" rx="4" />
      <path className={styles.line} d="M78 62 L78 104" />
    </g>
  </>
);

const SCENES: Record<string, () => ReactElement> = { "01": Feed, "02": Vet, "03": Seeds, "04": Chicks, "05": Agro, "06": Tools };

/** Animación que cuenta en tres pasos lo que resuelve cada línea; corre solo mientras la tarjeta está activa. */
export const LineStory = ({ code, active }: { code: string; active: boolean }) => {
  const Scene = SCENES[code] ?? Feed;
  const steps = STORY_STEPS[code] ?? STORY_STEPS["01"]!;
  return (
    <div className={[styles.story, active ? styles.on : ""].join(" ")} aria-hidden="true">
      <svg viewBox="0 0 400 230" className={styles.svg}>
        <Scene />
      </svg>
      <ol className={styles.steps}>
        {steps.map((s, i) => (
          <li key={s} style={d(i)}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
};
