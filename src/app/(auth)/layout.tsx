import { SiteShell } from "@/components/layout/SiteShell";
import styles from "@/features/auth/components/AuthPage.module.scss";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <SiteShell className={styles.shell}>{children}</SiteShell>;
}
