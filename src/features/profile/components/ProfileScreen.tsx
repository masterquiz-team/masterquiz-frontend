import type { Account } from "../types";
import { DeleteAccount } from "./DeleteAccount";
import { NicknameForm } from "./NicknameForm";
import styles from "./Profile.module.scss";

export function ProfileScreen({ account }: { account: Account }) {
  return (
    <div className={styles.profile}>
      <h1>Profile</h1>

      <dl className={styles.details}>
        <dt>Username</dt>
        <dd>{account.nickname}</dd>
        <dt>Email</dt>
        <dd>{account.email}</dd>
        <dt>Total score</dt>
        <dd>{account.score}</dd>
      </dl>

      <section aria-labelledby="edit-profile">
        <h2 id="edit-profile">Change username</h2>
        <NicknameForm nickname={account.nickname} />
      </section>

      <DeleteAccount />
    </div>
  );
}
