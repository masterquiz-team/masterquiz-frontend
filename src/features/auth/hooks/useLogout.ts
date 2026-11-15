"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { logout } from "../services/auth";

export function useLogout() {
  const router = useRouter();
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await logout();
      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to log out. Please try again.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return { handleLogout, pending, error };
}
