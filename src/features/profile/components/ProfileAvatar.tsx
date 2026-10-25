"use client";

import { useCallback, useState } from "react";
import styles from "./Profile.module.scss";

export function ProfileAvatar({ avatar }: { avatar: number | null }) {
  const [failed, setFailed] = useState<number | null>(null);
  const src =
    avatar !== null && failed !== avatar
      ? `/api/profile/avatar?n=${avatar}`
      : "/images/profile/avatar-placeholder.svg";
  // A fast 404 can arrive before hydration attaches onError.
  const imageRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (image?.complete && image.naturalWidth === 0 && avatar !== null)
        setFailed(avatar);
    },
    [avatar],
  );
  // The protected BFF image must use the browser's own session cookie.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={src}
      width={200}
      height={200}
      alt=""
      className={styles.avatar}
      onError={() => {
        if (avatar !== null) setFailed(avatar);
      }}
    />
  );
}
