import Image, { type StaticImageData } from "next/image";

export function DesignAsset({
  src,
  className,
}: {
  src: StaticImageData;
  className?: string;
}) {
  // Preserve fractional intrinsic dimensions of the original exported SVG.
  if (src.src.endsWith(".svg")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src.src} alt="" className={className} />;
  }
  return (
    <Image src={src} alt="" unoptimized loading="eager" className={className} />
  );
}
