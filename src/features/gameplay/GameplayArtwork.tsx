import { DesignAsset } from "@/components/ui/DesignAsset";
import { gameplayAssets as assets } from "./assets";
import styles from "./Gameplay.module.scss";
export { DesignAsset };

export function CorrectArtwork() {
  return (
    <div className={styles.correctArtwork} aria-hidden="true">
      <div className={styles.globeCrop}>
        <DesignAsset
          src={assets.correct.imgPenup202610111323311}
          className={styles.globeRaster}
        />
      </div>
      <span className={styles.correctMark}>
        <DesignAsset src={assets.correct.imgEllipse14} />
        <DesignAsset
          src={assets.correct.imgVector}
          className={styles.correctCheck}
        />
      </span>
    </div>
  );
}
