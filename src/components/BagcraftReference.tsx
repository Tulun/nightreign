"use client";

import { useMemo, useState } from "react";
import { bagcraftItems, BAGCRAFT_CREDIT } from "@/data/bagcraft";
import { BAGCRAFT_CATEGORIES, type BagcraftCategory, type BagcraftItem } from "@/lib/bagcraft";

type Filter = BagcraftCategory | "all";

/**
 * Bagcraft reference: filter consumables by category and read their level 1/2/3
 * effects. "All" groups every item under its category heading.
 */
export function BagcraftReference() {
  const [filter, setFilter] = useState<Filter>("all");

  const groups = useMemo(() => {
    const cats = filter === "all" ? BAGCRAFT_CATEGORIES : [filter];
    return cats.map((cat) => ({
      cat,
      items: bagcraftItems.filter((i) => i.category === cat),
    }));
  }, [filter]);

  return (
    <div>
      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </Chip>
        {BAGCRAFT_CATEGORIES.map((cat) => (
          <Chip key={cat} active={filter === cat} onClick={() => setFilter(cat)}>
            {cat}
          </Chip>
        ))}
      </div>

      <div className="space-y-8">
        {groups.map(({ cat, items }) => (
          <section key={cat}>
            <h3 className="eyebrow mb-3 text-gold-bright">{cat}</h3>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 font-body text-xs text-parchment-faint">{BAGCRAFT_CREDIT}</p>
    </div>
  );
}

function ItemCard({ item }: { item: BagcraftItem }) {
  return (
    <div className="frame rounded-lg bg-night-800 p-4">
      <p className="font-display text-base font-semibold text-parchment">{item.name}</p>
      <dl className="mt-2 space-y-1.5">
        <LevelRow level={1} text={item.l1} />
        <LevelRow level={2} text={item.l2} />
        <LevelRow level={3} text={item.l3} />
      </dl>
    </div>
  );
}

const LEVEL_STYLE: Record<number, string> = {
  1: "border-night-600 text-parchment-faint",
  2: "border-gold-faint text-parchment-muted",
  3: "border-gold bg-gold/10 text-gold-bright",
};

function LevelRow({ level, text }: { level: number; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <dt
        className={`mt-0.5 grid h-5 w-7 shrink-0 place-items-center rounded border text-[0.6rem] font-bold uppercase ${LEVEL_STYLE[level]}`}
      >
        L{level}
      </dt>
      <dd className="font-body text-sm text-parchment-muted">{text || "—"}</dd>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`frame rounded-md px-3 py-1.5 font-body text-sm transition-colors ${
        active
          ? "bg-night-700 text-gold-bright"
          : "bg-night-800 text-parchment-muted hover:bg-night-700 hover:text-parchment"
      }`}
      style={active ? { borderColor: "#c9a227" } : undefined}
    >
      {children}
    </button>
  );
}
