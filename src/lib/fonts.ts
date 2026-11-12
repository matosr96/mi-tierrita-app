/**
 * Fuentes de la app, servidas desde `public/fonts` (Urbanist y Geist Mono, licencia SIL OFL, variables: un archivo por
 * subconjunto cubre todos los grosores). Las mismas caras se declaran con `@font-face` en `styles/global.css`; esta
 * lista la usa el PDF (`lib/pdf.ts`) para incrustarlas como data URL, porque un dibujo SVG no carga fuentes externas.
 */
const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT = "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF";

export type FontFile = { family: string; weight: string; url: string; unicodeRange: string };

export const FONT_FILES: FontFile[] = [
  { family: "Urbanist", weight: "300 700", url: "/fonts/urbanist-latin-ext.woff2", unicodeRange: LATIN_EXT },
  { family: "Urbanist", weight: "300 700", url: "/fonts/urbanist-latin.woff2", unicodeRange: LATIN },
  { family: "Geist Mono", weight: "400 500", url: "/fonts/geist-mono-latin-ext.woff2", unicodeRange: LATIN_EXT },
  { family: "Geist Mono", weight: "400 500", url: "/fonts/geist-mono-latin.woff2", unicodeRange: LATIN },
];
