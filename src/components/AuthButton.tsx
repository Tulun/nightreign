"use client";

import { useEffect, useRef, useState } from "react";
import { signInWithGoogle, signOutUser, useAuth } from "@/lib/useAuth";

/**
 * Top-bar auth control: a "Sign in" button when signed out, the account's
 * avatar (with a small sign-out menu) when signed in. While the initial auth
 * state restores it renders nothing, so signed-out users never see a flash.
 */
export function AuthButton() {
  const user = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account menu on any outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  if (user === undefined) return null;

  if (user === null) {
    return (
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className="frame flex h-9 items-center gap-2 rounded px-3 text-xs font-semibold uppercase tracking-wider text-parchment-muted transition-colors hover:bg-night-800 hover:text-gold"
      >
        <GoogleIcon />
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  const initial = (user.displayName ?? user.email ?? "?").charAt(0).toUpperCase();
  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Account"
        aria-expanded={menuOpen}
        className="frame grid h-9 w-9 place-items-center overflow-hidden rounded transition-colors hover:bg-night-800"
      >
        {user.photoURL ? (
          // Google avatars 403 without no-referrer.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-gold">{initial}</span>
        )}
      </button>
      {menuOpen && (
        <div className="frame absolute right-0 top-11 z-50 min-w-44 rounded border border-night-600 bg-night-900 py-1 shadow-2xl">
          <div className="truncate px-3 py-1.5 text-xs text-parchment-faint">
            {user.displayName ?? user.email}
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              void signOutUser();
            }}
            className="w-full px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-parchment-muted transition-colors hover:bg-night-800 hover:text-gold"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3.01c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.11A11.99 11.99 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.29a12.03 12.03 0 0 0 0 10.78l4-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 1.29 6.61l4 3.11C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
  );
}
