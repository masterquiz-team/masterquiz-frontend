import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { categoryArtwork } from "../../design-preview";
import styles from "./CategoryCard.module.scss";

type Props = {
  name: string;
  href?: string;
  selected?: boolean;
  requiresLogin?: boolean;
};

export function CategoryCard({
  name,
  href,
  selected = false,
  requiresLogin = false,
}: Props) {
  const artwork = categoryArtwork.find(
    (item) => item.name.toLowerCase() === name.toLowerCase(),
  );
  const content = (
    <>
      <div className={styles.illustration} aria-hidden="true">
        {artwork?.illustration && (
          <Image src={artwork.illustration} alt="" width={240} height={210} />
        )}
      </div>
      <h2 className={styles.title}>{name}</h2>
      <div className={styles.descriptionPlaceholder} aria-hidden="true">
        <span />
        <span />
      </div>
      {href && (
        <span className={styles.action} aria-hidden="true">
          <span className={styles.actionCircle}>
            <Icon name="arrow" className={styles.actionIcon} />
          </span>
        </span>
      )}
    </>
  );
  return (
    <li>
      {href ? (
        <Link
          href={href}
          prefetch={false}
          scroll={requiresLogin}
          className={`${styles.card} ${selected ? styles.selected : ""}`}
          aria-current={selected ? "true" : undefined}
          aria-label={
            requiresLogin ? `${name} — log in to browse categories` : undefined
          }
        >
          {content}
        </Link>
      ) : (
        <div className={styles.card}>{content}</div>
      )}
    </li>
  );
}
