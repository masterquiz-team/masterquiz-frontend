import styles from "./Hero.module.scss";
import { PlayLink } from "@/features/auth/components/PlayLink";
import { Icon } from "@/components/ui/Icon";
import { CategoriesPreview } from "../CategoriesPreview";

export const Hero = () => (
  <section className={styles.hero}>
    <div>
      <ul className={styles.modes}>
        <li>Play</li>
        <li>
          <span aria-hidden="true" className={styles.dot}>
            •
          </span>
          Learn
        </li>
        <li>
          <span aria-hidden="true" className={styles.dot}>
            •
          </span>
          Compete
        </li>
      </ul>
      <h1 id="hero-title" className={styles.title}>
        Test your knowledge.
        <br />
        Discover something <span>new.</span>
      </h1>
      <p className={styles.description}>
        MasterQuiz is an online trivia game with questions from wide range of
        categories. Challenge yourself, earn points and compete with others!
      </p>
      <PlayLink href="/categories" className={styles.startButton}>
        Start Playing
        <Icon name="arrow" className={styles.arrowIcon} />
      </PlayLink>
    </div>
    <CategoriesPreview />
  </section>
);
