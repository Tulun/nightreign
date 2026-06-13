"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "./Sidebar";

/**
 * App frame: a slim top bar with a menu toggle, and a left nav drawer that is
 * closed by default and slides in over the content (so the reference tables
 * get the full width).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-dvh">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-night-600 bg-night-950/85 px-4 py-2.5 backdrop-blur sm:px-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="nav-drawer"
          className="frame grid h-9 w-9 shrink-0 place-items-center rounded text-parchment-muted transition-colors hover:bg-night-800 hover:text-gold"
        >
          <MenuIcon />
        </button>
        <Link href="/town-map" className="font-display text-base font-bold tracking-wide text-parchment">
          Night<span className="text-gold">reign</span>
          <span className="ml-2 hidden font-body text-xs uppercase tracking-[0.28em] text-parchment-faint sm:inline">
            Field Grimoire
          </span>
        </Link>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px]"
          aria-hidden="true"
        />
      )}

      {/* Nav drawer */}
      <aside
        id="nav-drawer"
        aria-hidden={!open}
        className={`fixed left-0 top-0 z-50 h-dvh w-72 max-w-[85vw] transform border-r border-night-600 bg-night-900 shadow-2xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="mx-auto w-full max-w-[1120px] px-5 py-8 sm:px-8 md:py-10">
        {children}
      </main>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
    </svg>
  );
}
