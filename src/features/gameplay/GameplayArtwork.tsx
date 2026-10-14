import { DesignAsset } from "@/components/ui/DesignAsset";
import { assets } from "./assets";
import styles from "./Gameplay.module.scss";
export { DesignAsset };

export function CorrectArtwork() {
  return (
    <div className={styles.correctArtwork} aria-hidden="true">
      <div className={styles.globeCrop}>
        <DesignAsset
          src={assets.correct.globe}
          className={styles.globeRaster}
        />
      </div>
      <span className={styles.correctMark}>
        <DesignAsset src={assets.correct.badge} />
        <DesignAsset
          src={assets.correct.check}
          className={styles.correctCheck}
        />
      </span>
    </div>
  );
}
