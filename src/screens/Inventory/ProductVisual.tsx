import { useId, useMemo } from "react";
import styles from "./ProductMosaic.module.css";

type Props = { seed: number; variant: number };

const W = 320;
const H = 200;

/** Generador pseudoaleatorio determinista (mulberry32): el mismo producto siempre dibuja la misma figura. */
const rng = (seed: number) => {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const f = (n: number) => n.toFixed(1);

/** Curvas de nivel: anillos deformados alrededor de una cima. */
const contours = (rand: () => number) => {
  const cx = W * (0.25 + rand() * 0.5);
  const cy = H * (0.3 + rand() * 0.4);
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;
  const a1 = 0.12 + rand() * 0.14;
  const a2 = 0.05 + rand() * 0.1;
  const step = 16 + rand() * 8;
  return Array.from({ length: 13 }, (_, k) => {
    const r = 10 + k * step;
    const pts = Array.from({ length: 56 }, (_, i) => {
      const th = (i / 56) * Math.PI * 2;
      const rr = r * (1 + a1 * Math.sin(2 * th + p1 + k * 0.18) + a2 * Math.sin(3 * th + p2 - k * 0.11));
      return `${f(cx + rr * Math.cos(th))},${f(cy + rr * Math.sin(th) * 0.78)}`;
    });
    return `M${pts.join("L")}Z`;
  });
};

/** Surcos: líneas onduladas como un campo arado visto desde arriba. */
const furrows = (rand: () => number) => {
  const amp = 6 + rand() * 10;
  const freq = 1.2 + rand() * 1.8;
  const phase = rand() * Math.PI * 2;
  const tilt = (rand() - 0.5) * 0.5;
  return Array.from({ length: 17 }, (_, k) => {
    const y0 = -20 + k * 15;
    const pts = Array.from({ length: 33 }, (_, i) => {
      const x = (i / 32) * W;
      const y = y0 + tilt * x + amp * Math.sin((x / W) * Math.PI * 2 * freq + phase + k * 0.35);
      return `${f(x)},${f(y)}`;
    });
    return `M${pts.join("L")}`;
  });
};

/** Semillero: retícula de puntos cuyo tamaño crece hacia un foco. */
const seedbed = (rand: () => number) => {
  const fx = W * rand();
  const fy = H * rand();
  const gap = 14 + Math.floor(rand() * 5);
  const reach = 150 + rand() * 90;
  const dots: { x: number; y: number; r: number }[] = [];
  for (let y = gap / 2; y < H; y += gap)
    for (let x = gap / 2 + ((y / gap) % 2 ? gap / 2 : 0); x < W; x += gap) {
      const d = Math.hypot(x - fx, y - fy);
      const r = Math.max(0.6, (1 - d / reach) * gap * 0.42);
      dots.push({ x, y, r });
    }
  return dots;
};

/** Visual generativo del producto (la API no trae imagen): figura sembrada por el id, tono por la línea. */
export const ProductVisual = ({ seed, variant }: Props) => {
  const raw = useId();
  const grainId = `grain-${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const kind = variant % 3;
  const shape = useMemo(() => {
    const rand = rng(seed + 1);
    return kind === 0 ? { lines: contours(rand), closed: true } : kind === 1 ? { lines: furrows(rand), closed: false } : { dots: seedbed(rand) };
  }, [seed, kind]);

  return (
    <svg className={styles.visualSvg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id={grainId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed % 997} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect className={styles.visualGlow} width={W} height={H} />
      {"dots" in shape && shape.dots
        ? shape.dots.map((d, i) => <circle key={i} cx={f(d.x)} cy={f(d.y)} r={f(d.r)} className={styles.visualDot} />)
        : shape.lines?.map((d, i) => <path key={i} d={d} className={i % 4 === 0 ? styles.visualLineStrong : styles.visualLine} style={{ opacity: 0.35 + (i / shape.lines.length) * 0.5 }} />)}
      <rect width={W} height={H} filter={`url(#${grainId})`} className={styles.visualGrain} />
    </svg>
  );
};
