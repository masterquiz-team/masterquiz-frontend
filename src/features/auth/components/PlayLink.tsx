"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { ensurePlaySession } from "../services/auth";
import { getSafeRedirect } from "../utils/redirect";

// Keep native link behavior for opening a new tab; the destination also offers
// guest entry when reached directly. Session creation only happens on intent.
export function PlayLink({
  href,
  children,
  className,
  "aria-label": label,
  "aria-current": current,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  "aria-current"?: "true" | "page";
  prefetch?: false;
}) {
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const target = getSafeRedirect(href);

  return (
    <>
      <Link
        href={target}
        prefetch={false}
        className={className}
        aria-label={label}
        aria-current={current}
        aria-disabled={pending || undefined}
        aria-busy={pending}
        onClick={async (event) => {
          if (
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
          )
            return;
          event.preventDefault();
          if (busy.current) return;
          busy.current = true;
          setPending(true);
          setError(null);
          try {
            await ensurePlaySession();
            router.push(target);
            router.refresh();
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Unable to start guest play.",
            );
          } finally {
            busy.current = false;
            setPending(false);
          }
        }}
      >
        {children}
      </Link>
      {pending && <span role="status">Opening play…</span>}
      {error && <span role="alert">{error}</span>}
    </>
  );
}
