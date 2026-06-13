"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Reference categories. To add a new view:
 *   1. Create a route under src/app (e.g. src/app/nightlords/page.tsx).
 *   2. Set `href` here and remove `soon`.
 */
const sections: { label: string; href: string; soon?: boolean }[] = [
  { label: "Town Map Seeds", href: "/town-map" },
  { label: "Nightlords", href: "/nightlords", soon: true },
  { label: "Relics", href: "/relics", soon: true },
  { label: "Shifting Earth", href: "/shifting-earth", soon: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-night-600 md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <div className="px-5 py-7 sm:px-8 md:px-7">
        <Link href="/town-map" className="block">
          <p className="eyebrow">Elden Ring</p>
          <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-parchment">
            Night<span className="text-gold">reign</span>
          </h1>
          <p className="mt-1 font-display text-[0.7rem] uppercase tracking-[0.3em] text-parchment-faint">
            Field Grimoire
          </p>
        </Link>

        <nav className="mt-8">
          <ul className="space-y-1">
            {sections.map((s) => {
              const active =
                !s.soon &&
                (pathname === s.href || pathname.startsWith(s.href + "/"));

              if (s.soon) {
                return (
                  <li key={s.label}>
                    <span className="flex items-center justify-between rounded px-3 py-2 font-body text-parchment-faint">
                      {s.label}
                      <span className="eyebrow text-[0.55rem]">soon</span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={s.label}>
                  <Link
                    href={s.href}
                    className={`block rounded px-3 py-2 font-body transition-colors ${
                      active
                        ? "bg-night-800 text-gold-bright frame border-night-600"
                        : "text-parchment-muted hover:bg-night-850 hover:text-parchment"
                    }`}
                  >
                    {s.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
