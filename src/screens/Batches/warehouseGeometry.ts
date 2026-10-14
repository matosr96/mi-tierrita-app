/**
 * Geometría isométrica de la bodega: solo dibujo (posiciones en pantalla), sin cifras de negocio.
 * Mundo: x a lo largo del estante, y en profundidad (y crece hacia el frente), z en altura.
 */
const C = Math.cos(Math.PI / 6);
const S = 0.5;

export const RACKS = 3;
export const LEVELS = 3;
export const PER_SHELF = 4;
export const SLOTS = RACKS * LEVELS * PER_SHELF;

const BOX_W = 30;
const BOX_D = 24;
const BOX_H = 22;
const PITCH = 36;
const PAD = 6;
const RACK_LEN = PAD * 2 + PER_SHELF * PITCH - (PITCH - BOX_W);
const RACK_DEPTH = 32;
const LEVEL_H = 42;
const PLANK = 4;
const BASE = 8;
const RACK_H = BASE + LEVELS * LEVEL_H;
const GAP = 34;
const POST = 3;

const WORLD_LEN = RACKS * RACK_LEN + (RACKS - 1) * GAP;
const OX = RACK_DEPTH * C + 34;
const OY = RACK_H + 52;

export const VIEW_W = Math.ceil((WORLD_LEN + RACK_DEPTH) * C + 68);
export const VIEW_H = Math.ceil((WORLD_LEN + RACK_DEPTH) * S + OY + 26);

const p = (x: number, y: number, z: number): string => `${((x - y) * C + OX).toFixed(1)},${((x + y) * S - z + OY).toFixed(1)}`;

export type Prism = { top: string; front: string; side: string };

/** Las tres caras visibles de un prisma (arriba, frente +y, costado +x). */
const prism = (x: number, y: number, z: number, w: number, d: number, h: number): Prism => ({
  top: [p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)].join(" "),
  front: [p(x, y + d, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x, y + d, z + h)].join(" "),
  side: [p(x + w, y, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x + w, y, z + h)].join(" "),
});

export type RackShape = {
  floor: string;
  back: string;
  backPosts: Prism[];
  frontPosts: Prism[];
  planks: Prism[];
};

const rackX = (r: number): number => r * (RACK_LEN + GAP);
const plankTop = (level: number): number => BASE + level * LEVEL_H;

export const racks: RackShape[] = Array.from({ length: RACKS }, (_, r) => {
  const x0 = rackX(r);
  const x1 = x0 + RACK_LEN;
  return {
    floor: [p(x0 - 6, -6, 0), p(x1 + 6, -6, 0), p(x1 + 6, RACK_DEPTH + 10, 0), p(x0 - 6, RACK_DEPTH + 10, 0)].join(" "),
    back: [p(x0, 0, 0), p(x1, 0, 0), p(x1, 0, RACK_H), p(x0, 0, RACK_H)].join(" "),
    backPosts: [prism(x0, 0, 0, POST, POST, RACK_H + PLANK), prism(x1 - POST, 0, 0, POST, POST, RACK_H + PLANK)],
    frontPosts: [prism(x0, RACK_DEPTH - POST, 0, POST, POST, RACK_H + PLANK), prism(x1 - POST, RACK_DEPTH - POST, 0, POST, POST, RACK_H + PLANK)],
    planks: [...Array.from({ length: LEVELS }, (_, k) => prism(x0, 0, plankTop(k) - PLANK, RACK_LEN, RACK_DEPTH, PLANK)), prism(x0, 0, RACK_H, RACK_LEN, RACK_DEPTH, PLANK)],
  };
});

export type Slot = {
  /** Posición FEFO: 0 sale primero. */
  index: number;
  box: Prism;
  footprint: string;
  /** Transformación que apoya un texto sobre la cara frontal de la caja. */
  labelMatrix: string;
  /** Punto en pantalla sobre la caja (para marcas). */
  anchor: { x: number; y: number };
};

/** Huecos en orden FEFO: fila de arriba de izquierda a derecha cruzando estantes, luego la siguiente fila hacia abajo. */
export const slots: Slot[] = Array.from({ length: SLOTS }, (_, index) => {
  const perRow = RACKS * PER_SHELF;
  const row = Math.floor(index / perRow);
  const col = index % perRow;
  const r = Math.floor(col / PER_SHELF);
  const s = col % PER_SHELF;
  const level = LEVELS - 1 - row;
  const x = rackX(r) + PAD + s * PITCH;
  const y = (RACK_DEPTH - BOX_D) / 2;
  const z = plankTop(level);
  const [lx, ly] = p(x + 4, y + BOX_D, z + 8).split(",").map(Number);
  const [ax, ay] = p(x + BOX_W / 2, y + BOX_D / 2, z + BOX_H).split(",").map(Number);
  return {
    index,
    box: prism(x, y, z, BOX_W, BOX_D, BOX_H),
    footprint: [p(x, y, z), p(x + BOX_W, y, z), p(x + BOX_W, y + BOX_D, z), p(x, y + BOX_D, z)].join(" "),
    labelMatrix: `matrix(${C.toFixed(3)} ${S} 0 1 ${(lx ?? 0).toFixed(1)} ${(ly ?? 0).toFixed(1)})`,
    anchor: { x: ax ?? 0, y: ay ?? 0 },
  };
});

/** Orden de pintura: de atrás hacia delante (mayor x + y queda al frente), luego de abajo arriba. */
export const paintOrder: Slot[] = [...slots].sort((a, b) => {
  const ra = Math.floor((a.index % (RACKS * PER_SHELF)) / PER_SHELF);
  const rb = Math.floor((b.index % (RACKS * PER_SHELF)) / PER_SHELF);
  if (ra !== rb) return ra - rb;
  const ca = a.index % PER_SHELF;
  const cb = b.index % PER_SHELF;
  if (ca !== cb) return ca - cb;
  return b.index - a.index;
});
