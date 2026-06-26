"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { shields as smallMedium } from "@/data/shields";
import { greatshields } from "@/data/greatshields";
import { iconFor } from "@/data/weaponIcons";
import { STAT_ORDER, type Affinity } from "@/lib/greatshields";
import { AFFINITY_ICON } from "@/lib/weapons";
import { asset } from "@/lib/assets";
import { WeaponIcon } from "@/components/WeaponIcon";
import { Dropdown } from "@/components/Dropdown";

type ShieldClass = "small" | "medium" | "great";

interface ShieldRow {
  id: string;
  name: string;
  cls: ShieldClass;
  negation: Record<Affinity, number>;
  guardBoost: number;
}

const CLASS_META: Record<ShieldClass, { label: string; color: string }> = {
  small: { label: "Small", color: "#8b93a1" },
  medium: { label: "Medium", color: "#5aa8e6" },
  great: { label: "Greatshield", color: "#b07ce8" },
};

const CLASS_RANK: Record<ShieldClass, number> = { small: 0, medium: 1, great: 2 };

/** All shields (small, medium, great) merged into one list. */
const ALL_SHIELDS: ShieldRow[] = [
  ...smallMedium.map((s) => ({ id: s.id, name: s.name, cls: s.class as ShieldClass, negation: s.negation, guardBoost: s.guardBoost })),
  ...greatshields.map((g) => ({ id: g.id, name: g.name, cls: "great" as ShieldClass, negation: g.negation, guardBoost: g.guardBoost })),
];

type SortKey = "name" | "guardBoost" | Affinity;

export function ShieldsReference() {
  const [query, setQuery] = useState("");
  const [cls, setCls] = useState("all");
  const [sort, setSort] = useState<SortKey>("name");

  const q = query.trim().toLowerCase();
  const list = useMemo(() => {
    const filtered = ALL_SHIELDS.filter((s) => {
      if (cls !== "all" && s.cls !== cls) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sort === "name") {
        const c = CLASS_RANK[a.cls] - CLASS_RANK[b.cls];
        return c !== 0 ? c : a.name.localeCompare(b.name);
      }
      if (sort === "guardBoost") return b.guardBoost - a.guardBoost || a.name.localeCompare(b.name);
      return b.negation[sort] - a.negation[sort] || a.name.localeCompare(b.name);
    });
  }, [q, cls, sort]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shields by name…"
          className="w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint focus:border-gold-faint focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Select
            label="Class"
            value={cls}
            onChange={setCls}
            options={["small", "medium", "great"]}
            labels={{ small: "Small", medium: "Medium", great: "Greatshield" }}
          />
          <Select
            label="Sort by"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={["name", "magic", "fire", "lightning", "holy", "guardBoost"]}
            labels={{ name: "Class & name", magic: "Magic", fire: "Fire", lightning: "Lightning", holy: "Holy", guardBoost: "Guard Boost" }}
          />
        </div>
      </div>

      <p className="mb-2 font-body text-xs text-parchment-faint">
        {list.length} of {ALL_SHIELDS.length} shields
      </p>

      <div className="frame max-h-[75vh] overflow-auto rounded-lg">
        <table className="w-full border-collapse text-left font-body text-sm">
          <thead>
            <tr className="text-parchment-faint">
              <th className="sticky left-0 top-0 z-30 border-b border-night-600 bg-night-850 px-3 py-2.5 font-semibold">Name</th>
              <th className="sticky top-0 z-20 border-b border-night-600 bg-night-850 px-2.5 py-2.5 font-semibold">Class</th>
              {STAT_ORDER.map((s) => (
                <th key={s.key} className="sticky top-0 z-20 border-b border-night-600 bg-night-850 px-2.5 py-2.5 text-right font-semibold">
                  {AFFINITY_ICON[s.key] ? (
                    <Image src={asset(AFFINITY_ICON[s.key])} alt={s.label} title={s.label} width={18} height={18} className="ml-auto" />
                  ) : (
                    s.label
                  )}
                </th>
              ))}
              <th className="sticky top-0 z-20 border-b border-night-600 bg-night-850 px-2.5 py-2.5 text-right font-semibold">Guard</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <Row key={`${s.cls}:${s.id}`} s={s} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 font-body text-xs text-parchment-faint">
        Guarded Damage Negation (%); physical is 100 for all shields. Stats from
        eldenringnightreign.wiki.fextralife.com.
      </p>
    </div>
  );
}

function Row({ s }: { s: ShieldRow }) {
  const meta = CLASS_META[s.cls];
  return (
    <tr className="border-b border-night-800/70 hover:bg-night-800/60">
      <td className="sticky left-0 z-10 bg-night-900 px-3 py-2.5 font-display font-semibold text-parchment">
        <div className="flex items-center gap-2.5">
          <WeaponIcon src={iconFor({ name: s.name })} alt={s.name} size={44} />
          <span>{s.name}</span>
        </div>
      </td>
      <td className="px-2.5 py-2.5">
        <span style={{ color: meta.color }}>{meta.label}</span>
      </td>
      {STAT_ORDER.map((stat) => {
        const v = s.negation[stat.key];
        return (
          <td key={stat.key} className="px-2.5 py-2.5 text-right tabular-nums text-parchment-muted">
            {v}
          </td>
        );
      })}
      <td className="px-2.5 py-2.5 text-right tabular-nums font-semibold text-gold-dim">{s.guardBoost}</td>
    </tr>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">{label}</span>
      <Dropdown
        value={value}
        clearable={false}
        onChange={onChange}
        options={[{ value: "all", label: "All" }, ...options.map((o) => ({ value: o, label: labels?.[o] ?? o }))]}
      />
    </label>
  );
}
