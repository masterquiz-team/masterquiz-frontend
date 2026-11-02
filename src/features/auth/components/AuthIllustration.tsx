import Image from "next/image";
import welcomeIllustration from "../../../../public/images/auth/welcome-illustration.png";
import styles from "./AuthIllustration.module.scss";

// Figma group "login and sign up icon", exported at 2x with its transparent
// bounds so the visible art keeps the frame's placement.
export function AuthIllustration() {
  return (
    <div className={styles.slot} aria-hidden="true">
      <Image
        className={styles.image}
        src={welcomeIllustration}
        alt=""
        sizes="(max-width: 1199px) calc(100vw - 80px), 686px"
      />
    </div>
  );
}
