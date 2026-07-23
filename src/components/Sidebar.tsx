"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Drawer contents: reference categories, grouped. To add a new view:
 *   1. Create a route under src/app (e.g. src/app/nightlords/page.tsx).
 *   2. Add it to a group below (remove `soon` once it's live).
 *
 * The first group has no title — it's the during-a-run quick reference.
 */
type NavItem = { label: string; href: string; soon?: boolean };
type NavGroup = { title?: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    items: [
      { label: "Merchant Inventories", href: "/town-map" },
      { label: "Great Hollow", href: "/great-hollow" },
    ],
  },
  {
    title: "Nightfarers",
    items: [
      { label: "Base Stats", href: "/nightfarers" },
      { label: "Stat Swaps", href: "/stat-swaps" },
      { label: "Recluse Cocktails", href: "/recluse-cocktails" },
      { label: "Magic Spells", href: "/magic-spells" },
      { label: "Bagcraft", href: "/bagcraft" },
      { label: "Greatshield Affinity", href: "/greatshields" },
      { label: "Negation Calculator", href: "/negation" },
      { label: "Attack Calculator", href: "/attack" },
    ],
  },
  {
    title: "Items",
    items: [
      { label: "Relic Effects", href: "/relics" },
      { label: "Unique Relics", href: "/unique-relics" },
      { label: "Weapons", href: "/weapons" },
      { label: "Shields", href: "/shields" },
      { label: "Talismans", href: "/talismans" },
      { label: "Weapon Passives", href: "/weapon-passives" },
      { label: "Weapon Skills", href: "/weapon-skills" },
    ],
  },
  {
    title: "Enemies",
    items: [
      { label: "Boss Codex", href: "/bosses" },
      { label: "Boss Loot", href: "/field-bosses" },
      { label: "Nightlords", href: "/nightlords" },
    ],
  },
  {
    title: "Other",
    items: [
      { label: "Depth Buffs", href: "/depth-buffs" },
      { label: "Night Invader Drops", href: "/night-invaders" },
      { label: "Libra Deals", href: "/libra" },
    ],
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const inGroup = (g: NavGroup) =>
    g.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"));

  // Titled groups start collapsed, except the one holding the current page.
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of groups) if (g.title) init[g.title] = inGroup(g);
    return init;
  });
  const toggle = (title: string) => setOpen((o) => ({ ...o, [title]: !o[title] }));

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
        {groups.map((group, i) => {
          const expanded = !group.title || open[group.title];
          return (
          <div key={group.title ?? `group-${i}`} className={i > 0 ? "mt-4" : ""}>
            {group.title && (
              <button
                type="button"
                onClick={() => toggle(group.title!)}
                aria-expanded={expanded}
                className="eyebrow flex w-full items-center justify-between rounded px-3 py-1.5 text-parchment-faint transition-colors hover:text-gold"
              >
                {group.title}
                <svg
                  viewBox="0 0 24 24"
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            )}
            {expanded && (
            <ul className="space-y-1 pt-1">
              {group.items.map((s) => {
                const active =
                  !s.soon && (pathname === s.href || pathname.startsWith(s.href + "/"));

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
            )}
          </div>
          );
        })}
      </nav>
    </div>
  );
}
