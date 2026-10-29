/**
 * Codificador QR propio, sin dependencias (ISO/IEC 18004): modo byte (UTF-8), versión automática 1–10, corrección M
 * y máscara elegida por penalización. Devuelve la matriz de módulos (true = oscuro) que `QrCode` pinta en SVG.
 * Solo se usa para el enlace de verificación de la portada de los reportes.
 */

export type QrMatrix = boolean[][];

/** Codewords de datos, codewords de corrección por bloque y bloques [cantidad, datos por bloque] (nivel M). */
const VERSIONS: { data: number; ec: number; blocks: [number, number][] }[] = [
  { data: 16, ec: 10, blocks: [[1, 16]] },
  { data: 28, ec: 16, blocks: [[1, 28]] },
  { data: 44, ec: 26, blocks: [[1, 44]] },
  { data: 64, ec: 18, blocks: [[2, 32]] },
  { data: 86, ec: 24, blocks: [[2, 43]] },
  { data: 108, ec: 16, blocks: [[4, 27]] },
  { data: 124, ec: 18, blocks: [[4, 31]] },
  { data: 154, ec: 22, blocks: [[2, 38], [2, 39]] },
  { data: 182, ec: 22, blocks: [[3, 36], [2, 37]] },
  { data: 216, ec: 26, blocks: [[4, 43], [1, 44]] },
];

/** Centros de los patrones de alineación por versión (la 1 no tiene). */
const ALIGNMENT: number[][] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

// ---------- aritmética en GF(256) para Reed-Solomon (polinomio primitivo 0x11d) ----------
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255]!;
})();
const mul = (a: number, b: number): number => (a === 0 || b === 0 ? 0 : EXP[LOG[a]! + LOG[b]!]!);

/** Polinomio generador de `n` codewords de corrección. */
const generator = (n: number): number[] => {
  let g = [1];
  for (let i = 0; i < n; i += 1) {
    const next = new Array<number>(g.length + 1).fill(0);
    g.forEach((coef, j) => {
      next[j] = (next[j] ?? 0) ^ coef;
      next[j + 1] = (next[j + 1] ?? 0) ^ mul(coef, EXP[i]!);
    });
    g = next;
  }
  return g;
};

const reedSolomon = (data: number[], n: number): number[] => {
  const g = generator(n);
  const rest = new Array<number>(n).fill(0);
  for (const byte of data) {
    const factor = byte ^ rest.shift()!;
    rest.push(0);
    if (factor !== 0) g.slice(1).forEach((coef, j) => (rest[j] = (rest[j] ?? 0) ^ mul(coef, factor)));
  }
  return rest;
};

// ---------- bits ----------
const toBytes = (text: string): number[] => Array.from(new TextEncoder().encode(text));

const buildCodewords = (bytes: number[], version: number): number[] => {
  const spec = VERSIONS[version - 1]!;
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version >= 10 ? 16 : 8);
  bytes.forEach((b) => push(b, 8));
  const capacity = spec.data * 8;
  push(0, Math.min(4, capacity - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  const pad = [0xec, 0x11];
  for (let i = 0; bits.length < capacity; i += 1) push(pad[i % 2]!, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0));

  // Bloques: datos entrelazados y luego la corrección entrelazada.
  const blocks: number[][] = [];
  const ecs: number[][] = [];
  let offset = 0;
  for (const [count, size] of spec.blocks) {
    for (let i = 0; i < count; i += 1) {
      const block = data.slice(offset, offset + size);
      blocks.push(block);
      ecs.push(reedSolomon(block, spec.ec));
      offset += size;
    }
  }
  const out: number[] = [];
  const longest = Math.max(...blocks.map((b) => b.length));
  for (let i = 0; i < longest; i += 1) blocks.forEach((b) => (i < b.length ? out.push(b[i]!) : undefined));
  for (let i = 0; i < spec.ec; i += 1) ecs.forEach((e) => out.push(e[i]!));
  return out;
};

// ---------- matriz ----------
type Grid = { size: number; modules: boolean[][]; reserved: boolean[][] };

const setSquare = (g: Grid, cx: number, cy: number, radius: number, pattern: (d: number) => boolean) => {
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= g.size || y >= g.size) continue;
      g.modules[y]![x] = pattern(Math.max(Math.abs(dx), Math.abs(dy)));
      g.reserved[y]![x] = true;
    }
  }
};

const placeFunctionPatterns = (g: Grid, version: number) => {
  const finder = (d: number) => d !== 2 && d !== 4;
  setSquare(g, 3, 3, 4, finder);
  setSquare(g, g.size - 4, 3, 4, finder);
  setSquare(g, 3, g.size - 4, 4, finder);
  for (let i = 8; i < g.size - 8; i += 1) {
    g.modules[6]![i] = i % 2 === 0;
    g.modules[i]![6] = i % 2 === 0;
    g.reserved[6]![i] = true;
    g.reserved[i]![6] = true;
  }
  // Alineación en toda combinación de centros salvo las tres esquinas que ocupan los buscadores.
  const centers = ALIGNMENT[version - 1]!;
  const last = centers.length - 1;
  centers.forEach((cy, i) => {
    centers.forEach((cx, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      setSquare(g, cx, cy, 2, (d) => d !== 1);
    });
  });
  // Zonas de información de formato (se escriben al final) y módulo oscuro fijo.
  for (let i = 0; i < 9; i += 1) {
    g.reserved[8]![i] = true;
    g.reserved[i]![8] = true;
    if (i < 8) {
      g.reserved[8]![g.size - 1 - i] = true;
      g.reserved[g.size - 1 - i]![8] = true;
    }
  }
  g.modules[g.size - 8]![8] = true;
  if (version >= 7) {
    for (let i = 0; i < 6; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        g.reserved[i]![g.size - 11 + j] = true;
        g.reserved[g.size - 11 + j]![i] = true;
      }
    }
  }
};

const placeData = (g: Grid, codewords: number[]) => {
  const bits: number[] = [];
  codewords.forEach((c) => {
    for (let i = 7; i >= 0; i -= 1) bits.push((c >> i) & 1);
  });
  let k = 0;
  let upward = true;
  for (let right = g.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < g.size; step += 1) {
      const y = upward ? g.size - 1 - step : step;
      for (const x of [right, right - 1]) {
        if (g.reserved[y]![x]) continue;
        g.modules[y]![x] = (bits[k] ?? 0) === 1;
        k += 1;
      }
    }
    upward = !upward;
  }
};

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

const applyMask = (g: Grid, mask: number): boolean[][] =>
  g.modules.map((row, y) => row.map((m, x) => (g.reserved[y]![x] ? m : m !== MASKS[mask]!(x, y))));

/** Código BCH(15,5) de la información de formato (nivel M = 00) con la máscara 0x5412. */
const formatBits = (mask: number): number => {
  const data = (0b00 << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >> 9) & 1 ? 0x537 : 0);
  return ((data << 10) | rem) ^ 0x5412;
};

/** Código BCH(18,6) de la información de versión (solo desde la versión 7). */
const versionBits = (version: number): number => {
  let rem = version;
  for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >> 11) & 1 ? 0x1f25 : 0);
  return (version << 12) | rem;
};

const writeFormat = (m: boolean[][], size: number, mask: number) => {
  const bits = formatBits(mask);
  const bit = (i: number) => ((bits >> i) & 1) === 1;
  for (let i = 0; i < 6; i += 1) m[i]![8] = bit(i);
  m[7]![8] = bit(6);
  m[8]![8] = bit(7);
  m[8]![7] = bit(8);
  for (let i = 9; i < 15; i += 1) m[8]![14 - i] = bit(i);
  for (let i = 0; i < 8; i += 1) m[8]![size - 1 - i] = bit(i);
  for (let i = 8; i < 15; i += 1) m[size - 15 + i]![8] = bit(i);
};

const writeVersion = (m: boolean[][], size: number, version: number) => {
  if (version < 7) return;
  const bits = versionBits(version);
  for (let i = 0; i < 18; i += 1) {
    const on = ((bits >> i) & 1) === 1;
    const a = Math.floor(i / 3);
    const b = size - 11 + (i % 3);
    m[a]![b] = on;
    m[b]![a] = on;
  }
};

/** Penalización de la norma: rachas, bloques 2×2, patrones parecidos al buscador y desequilibrio de oscuros. */
const penalty = (m: boolean[][]): number => {
  const size = m.length;
  let score = 0;
  const runs = (get: (i: number, j: number) => boolean) => {
    for (let i = 0; i < size; i += 1) {
      let run = 1;
      for (let j = 1; j < size; j += 1) {
        if (get(i, j) === get(i, j - 1)) {
          run += 1;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else run = 1;
      }
    }
  };
  runs((i, j) => m[i]![j]!);
  runs((i, j) => m[j]![i]!);
  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const v = m[y]![x];
      if (v === m[y]![x + 1] && v === m[y + 1]![x] && v === m[y + 1]![x + 1]) score += 3;
    }
  }
  const finderLike = (get: (i: number, j: number) => boolean) => {
    const pattern = [true, false, true, true, true, false, true];
    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j <= size - 7; j += 1) {
        if (!pattern.every((p, k) => get(i, j + k) === p)) continue;
        const before = j >= 4 && [1, 2, 3, 4].every((k) => !get(i, j - k));
        const after = j + 10 < size && [7, 8, 9, 10].every((k) => !get(i, j + k));
        if (before || after) score += 40;
      }
    }
  };
  finderLike((i, j) => m[i]![j]!);
  finderLike((i, j) => m[j]![i]!);
  const dark = m.flat().filter(Boolean).length;
  const ratio = Math.abs((dark * 100) / (size * size) - 50);
  score += Math.floor(ratio / 5) * 10;
  return score;
};

/** Matriz QR del texto (true = módulo oscuro). Lanza si el texto no cabe en la versión 10 (hasta 213 bytes). */
export const encodeQr = (text: string): QrMatrix => {
  const bytes = toBytes(text);
  const version = VERSIONS.findIndex((v, i) => bytes.length <= v.data - (i + 1 >= 10 ? 3 : 2)) + 1;
  if (version === 0) throw new Error("El texto no cabe en un QR de versión 10");
  const size = 17 + version * 4;
  const grid: Grid = {
    size,
    modules: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
    reserved: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
  };
  placeFunctionPatterns(grid, version);
  placeData(grid, buildCodewords(bytes, version));
  let best: QrMatrix = [];
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = applyMask(grid, mask);
    writeFormat(candidate, size, mask);
    writeVersion(candidate, size, version);
    const score = penalty(candidate);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
};
