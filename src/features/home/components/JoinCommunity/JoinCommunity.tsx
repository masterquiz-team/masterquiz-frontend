import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import styles from "./JoinCommunity.module.scss";

// Static preview from the design; backend data will be connected later.
const players = [
  { name: "Alex", score: "1,240" },
  { name: "Maria", score: "1,180" },
  { name: "John", score: "1,050" },
  { name: "You", score: "800" },
];

export const JoinCommunity = () => (
  <section className={styles.section}>
    <div className={styles.intro}>
      <div className={styles.illustration}>
        <Image
          src="/images/community-accent-top.svg"
          alt=""
          width={36}
          height={31}
          className={styles.topAccent}
        />
        <Image src="/ci_users-group.svg" alt="" width={132} height={132} />
        <Image
          src="/images/community-accent-bottom.svg"
          alt=""
          width={27}
          height={28}
          className={styles.bottomAccent}
        />
      </div>
      <div>
        <h2 className={styles.title}>Lorem ipsum dolor sit amet.</h2>
        <p className={styles.description}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
        <Link href="/register" className={styles.signUp}>
          Sign up
          <Icon name="arrow" className={styles.arrow} />
        </Link>
      </div>
    </div>
    <div className={styles.preview}>
      <Image
        src="/images/leaderboard-accent-left.svg"
        alt=""
        width={50}
        height={66}
        className={styles.leftAccent}
      />
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Top players</h3>
        <p className={styles.sampleRanking}>Sample ranking</p>
        <ol>
          {players.map((player, index) => (
            <li
              key={player.name}
              className={index === 3 ? styles.currentPlayer : styles.player}
            >
              <span>{index + 1}</span>
              <span className={styles.avatar} />
              <span>{player.name}</span>
              <span className={styles.score}>{player.score}</span>
            </li>
          ))}
        </ol>
      </div>
      <Image
        src="/images/leaderboard-accent-right.svg"
        alt=""
        width={40}
        height={70}
        className={styles.rightAccent}
      />
    </div>
  </section>
);
