import Image from "next/image";
import styles from "./Benefits.module.scss";
const benefits = [
  {
    title: "Learn",
    description: "Discover new facts and expand your knowledge.",
    icon: { src: "/images/home/benefit-learn.svg", width: 60, height: 60 },
    descriptionWidth: 181,
  },
  {
    title: "Earn points",
    description: "Track your progress and improve your score.",
    icon: { src: "/images/home/benefit-points.svg", width: 64, height: 63 },
    descriptionWidth: 177,
  },
  {
    title: "Compete",
    description: "Challenge other players and climb the leaderboard.",
    icon: { src: "/images/home/benefit-compete.svg", width: 51, height: 53 },
    descriptionWidth: 204,
  },
  {
    title: "Your profile",
    description: "See your stats, achievements and favorite categories.",
    icon: { src: "/images/home/benefit-profile.svg", width: 62, height: 62 },
    descriptionWidth: 219,
  },
];

export const Benefits = () => (
  <section id="about" className={styles.section}>
    <div className={styles.container}>
      <p className={styles.label}>Why play MasterQuiz?</p>
      <h2 id="benefits-title" className={styles.title}>
        More than just questions
      </h2>
      <ul className={styles.list}>
        {benefits.map((benefit) => (
          <li key={benefit.title}>
            <div aria-hidden="true" className={styles.icon}>
              <Image {...benefit.icon} alt="" />
            </div>
            <h3 className={styles.itemTitle}>{benefit.title}</h3>
            <p
              className={styles.description}
              style={{ maxWidth: benefit.descriptionWidth }}
            >
              {benefit.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
