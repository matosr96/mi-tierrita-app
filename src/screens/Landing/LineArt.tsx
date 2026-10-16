import styles from "./Landing.module.css";

/** Arte generativo de cada línea de producto (no hay fotos reales de la tienda todavía). */
export const LineArt = ({ code }: { code: string }) => {
  const id = `la-${code}`;
  const pattern = (() => {
    switch (code) {
      case "01": // granos
        return (
          <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
            <ellipse cx="9" cy="9" rx="3.2" ry="2" fill="currentColor" />
          </pattern>
        );
      case "02": // cruces de botiquín
        return (
          <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M13 7 V19 M7 13 H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </pattern>
        );
      case "03": // brotes
        return (
          <pattern id={id} width="24" height="30" patternUnits="userSpaceOnUse">
            <path d="M12 28 V14 M12 18 C 7 18 5 14 5 10 C 10 10 12 13 12 18 M12 15 C 17 15 19 11 19 7 C 14 7 12 10 12 15" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </pattern>
        );
      case "04": // plumas / arcos
        return (
          <pattern id={id} width="30" height="16" patternUnits="userSpaceOnUse">
            <path d="M0 14 Q 15 -2 30 14" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </pattern>
        );
      case "05": // gotas
        return (
          <pattern id={id} width="22" height="26" patternUnits="userSpaceOnUse">
            <path d="M11 5 C 15 11 16 14 16 16 A5 5 0 0 1 6 16 C 6 14 7 11 11 5 Z" fill="currentColor" />
          </pattern>
        );
      default: // malla de alambre
        return (
          <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M0 0 L16 16 M16 0 L0 16" stroke="currentColor" strokeWidth="1.1" />
          </pattern>
        );
    }
  })();
  return (
    <svg className={styles.lineArt} viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>{pattern}</defs>
      <rect className={styles.lineArtField} width="400" height="260" fill={`url(#${id})`} />
      <circle className={styles.lineArtSun} cx="300" cy="70" r="46" />
    </svg>
  );
};
