import styles from "./Hero.module.scss";
import { PlayLink } from "@/features/auth/components/PlayLink";
import { Icon } from "@/components/ui/Icon";
import { CategoriesPreview } from "../CategoriesPreview";

export const Hero = () => (
  <section className={styles.hero}>
    <div>
      <ul className={styles.modes}>
        <li>Play</li>
        <li>Learn</li>
        <li>Compete</li>
      </ul>
      <h1 id="hero-title" className={styles.title}>
        Lorem ipsum dolor.
        <br />
        Sit amet consectetur.
      </h1>
      <p className={styles.description}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <PlayLink href="/categories" className={styles.startButton}>
        Start Playing
        <Icon name="arrow" className={styles.arrowIcon} />
      </PlayLink>
    </div>
    <CategoriesPreview />
  </section>
);
