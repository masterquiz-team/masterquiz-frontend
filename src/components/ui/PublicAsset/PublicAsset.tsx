import Image from "next/image";
import type { CSSProperties } from "react";
import styles from "./PublicAsset.module.scss";

export function PublicAsset({
  src,
  size = 22,
  className,
}: {
  src: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={src}
      width={size}
      height={size}
      alt=""
      unoptimized
      className={`${styles.asset}${className ? ` ${className}` : ""}`}
      style={{ "--asset-size": `${size}px` } as CSSProperties}
    />
  );
}
