import Image from "next/image";
import styles from "./Benefits.module.scss";
const benefits = [
  {
    title: "Learn",
    description: "Discover new facts and expand your knowledge.",
    icon: "/images/brand/brain.svg",
  },
  {
    title: "Earn points",
    description: "Track your progress and improve your score.",
    icon: "/images/profile/stat-star.svg",
  },
  {
    title: "Compete",
    description: "Challenge other players and climb the leaderboard.",
    icon: "/images/profile/stat-trophy.svg",
  },
  {
    title: "Your profile",
    description: "See your stats, achievements and favorite categories.",
    icon: "/images/profile/avatar-header.svg",
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
              <Image src={benefit.icon} alt="" width={54} height={54} />
            </div>
            <h3 className={styles.itemTitle}>{benefit.title}</h3>
            <p className={styles.description}>{benefit.description}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
