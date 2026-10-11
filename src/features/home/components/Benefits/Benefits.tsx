import styles from "./Benefits.module.scss";
const benefits = [
  {
    title: "Lorem ipsum",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  {
    title: "Dolor sit amet",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  {
    title: "Consectetur adipiscing",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  {
    title: "Sed do eiusmod",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
];

export const Benefits = () => (
  <section id="about" className={styles.section}>
    <div className={styles.container}>
      <p className={styles.label}>Why play MasterQuiz?</p>
      <h2 id="benefits-title" className={styles.title}>
        Lorem ipsum dolor sit amet.
      </h2>
      <ul className={styles.list}>
        {benefits.map((benefit) => (
          <li key={benefit.title} className={styles.item}>
            <div aria-hidden="true" className={styles.imagePlaceholder} />
            <h3 className={styles.itemTitle}>{benefit.title}</h3>
            <p className={styles.description}>{benefit.description}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
