import { Navigation } from "@/components/layout/Navigation";
import { Brand } from "@/components/layout/Brand";
import Image from "next/image";
import styles from "./Footer.module.scss";

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <Brand />

        <Navigation />

        <div className={styles.socialLinks}>
          <Image
            className={styles.socialIcon}
            src="/akar-icons_instagram-fill.svg"
            alt="Instagram"
            width={24}
            height={24}
          />
          <Image
            className={styles.socialIcon}
            src="/bxl_twitter-x.svg"
            alt="X"
            width={24}
            height={24}
          />
        </div>
      </div>
    </footer>
  );
};
