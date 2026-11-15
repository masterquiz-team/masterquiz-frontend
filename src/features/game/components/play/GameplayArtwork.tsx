import { DesignAsset } from "@/components/ui/DesignAsset";
import { GlobeArtwork } from "../GlobeArtwork";
import { assets } from "../../assets/play";
import styles from "./Gameplay.module.scss";

export function CorrectArtwork() {
  return (
    <div className={styles.correctArtwork} aria-hidden="true">
      <GlobeArtwork
        src={assets.correct.globe}
        classes={{
          globeCrop: styles.globeCrop,
          globeRaster: styles.globeRaster,
        }}
      />
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
