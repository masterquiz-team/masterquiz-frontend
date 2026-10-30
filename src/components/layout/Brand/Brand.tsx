import Image from "next/image";
import Link from "next/link";
import styles from "./Brand.module.scss";

export function Brand({ href }: { href?: string }) {
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
    <div className={styles.brand}>{content}</div>
  );
}
