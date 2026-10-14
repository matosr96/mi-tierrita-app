import { useEffect, useState } from "react";
import styles from "./PhotoBackdrop.module.css";

const INTERVAL = 9000;

/** Fotografías en duotono con zoom lento (Ken Burns) que se alternan con un fundido. Sin fotos no pinta nada. */
export const PhotoBackdrop = ({ photos, className }: { photos: string[]; className?: string }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photos.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % photos.length), INTERVAL);
    return () => window.clearInterval(id);
  }, [photos.length]);

  if (photos.length === 0) return null;
  return (
    <div className={[styles.root, className ?? ""].join(" ")} aria-hidden="true">
      {photos.map((src, i) => (
        <img key={src} src={src} alt="" className={[styles.photo, i === index ? styles.active : ""].join(" ")} decoding="async" loading={i === 0 ? "eager" : "lazy"} />
      ))}
      <div className={styles.tint} />
      <div className={styles.light} />
    </div>
  );
};
