"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Auth state + actions. Signing in is entirely optional: signed-out users
//  keep the localStorage-only experience, an account just adds sync.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

/**
 * The signed-in user, `null` when signed out, or `undefined` while the
 * initial auth state is still being restored (first paint after load).
 */
export function useAuth(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return user;
}

/** Google sign-in via popup; resolves when the popup closes either way. */
export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    // Closing the popup rejects with auth/popup-closed-by-user — not an error
    // worth surfacing. Anything else, log so misconfig is diagnosable.
    const code = (err as { code?: string })?.code;
    if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
      console.error("Google sign-in failed:", err);
    }
  }
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}
