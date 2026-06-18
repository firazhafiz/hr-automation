"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

// In milliseconds. Example: 2 hours = 2 * 60 * 60 * 1000
const AUTO_LOGOUT_TIME = 2 * 60 * 60 * 1000;

export function AutoLogout() {
  const { status } = useSession();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run if the user is authenticated
    if (status !== "authenticated") return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, AUTO_LOGOUT_TIME);
    };

    // Initial setup
    resetTimer();

    // Event listeners for user interactions
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleActivity = () => {
      // Use requestAnimationFrame or throttling to prevent excessive timer resets if needed
      // But clearing and setting a timeout is generally cheap enough.
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [status]);

  return null;
}
