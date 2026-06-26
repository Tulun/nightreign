"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Drawer contents: the list of reference categories. To add a new view:
 *   1. Create a route under src/app (e.g. src/app/nightlords/page.tsx).
 *   2. Add it here and remove `soon`.
 */
const sections: { label: string; href: string; soon?: boolean }[] = [
  { label: "Town Map Seeds", href: "/town-map" },
  { label: "Nightfarers", href: "/nightfarers" },
  { label: "Negation Calculator", href: "/negation" },
  { label: "Attack Calculator", href: "/attack" },
  { label: "Greatshield Affinity", href: "/greatshields" },
  { label: "Shields", href: "/shields" },
  { label: "Great Hollow", href: "/great-hollow" },
  { label: "Recluse Cocktails", href: "/recluse-cocktails" },
  { label: "Bagcraft", href: "/bagcraft" },
  { label: "Libra Deals", href: "/libra" },
  { label: "Stat Swaps", href: "/stat-swaps" },
  { label: "Boss Loot", href: "/field-bosses" },
  { label: "Boss Codex", href: "/bosses" },
  { label: "Weapons", href: "/weapons" },
  { label: "Weapon Passives", href: "/weapon-passives" },
  { label: "Talismans", href: "/talismans" },
  { label: "Nightlords", href: "/nightlords" },
  { label: "Relics", href: "/relics" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-6">
        <p className="eyebrow">References</p>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close navigation"
          className="grid h-7 w-7 place-items-center rounded text-parchment-faint transition-colors hover:text-gold"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
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
                  onClick={onNavigate}
                  className={`block rounded px-3 py-2 font-body transition-colors ${
                    active
                      ? "frame border-night-600 bg-night-800 text-gold-bright"
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
  );
}
