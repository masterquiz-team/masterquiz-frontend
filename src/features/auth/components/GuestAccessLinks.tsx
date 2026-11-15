import Link from "next/link";
import { getSafeRedirect } from "../utils/redirect";

export function GuestAccessLinks({ next = "/categories" }: { next?: string }) {
  const query = new URLSearchParams({ next: getSafeRedirect(next) });
  return (
    <span>
      <Link href={`/register?${query}`}>Register</Link>
      {" · "}
      <Link href={`/login?${query}`}>Log in</Link>
    </span>
  );
}
