import Image from "next/image";
import Link from "next/link";
import styles from "./Brand.module.scss";

// `as` sets the wrapper when the brand is not a link, e.g. a footer heading.
export function Brand({
  href,
  as: Wrapper = "div",
}: {
  href?: string;
  as?: "div" | "h2";
}) {
  const content = (
    <>
      <Image
        className={styles.mark}
        src="/images/brand/brain.svg"
        width={50}
        height={50}
        alt=""
        unoptimized
      />
      <span>
        <span>Master</span>
        <span className={styles.quiz}>Quiz</span>
      </span>
    </>
  );

  return href ? (
    <Link href={href} className={styles.brand}>
      {content}
    </Link>
  ) : (
    <Wrapper className={styles.brand}>{content}</Wrapper>
  );
}
