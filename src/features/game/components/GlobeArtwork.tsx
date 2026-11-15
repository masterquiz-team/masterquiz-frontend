import type { ComponentProps } from "react";
import { DesignAsset } from "@/components/ui/DesignAsset";

export function GlobeArtwork({
  src,
  classes,
}: {
  src: ComponentProps<typeof DesignAsset>["src"];
  classes: { globeCrop: string; globeRaster: string };
}) {
  return (
    <div className={classes.globeCrop}>
      <DesignAsset src={src} className={classes.globeRaster} />
    </div>
  );
}
