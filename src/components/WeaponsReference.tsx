"use client";

import { useMemo, useState } from "react";
import { weapons } from "@/data/weapons";
import {
  AP_COLUMNS,
  RARITY_META,
  SCALING_STATS,
  WEAPON_CREDIT,
  type Weapon,
} from "@/lib/weapons";

export function WeaponsReference() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [scaling, setScaling] = useState("all");

  const types = useMemo(() => Array.from(new Set(weapons.map((w) => w.type))).sort(), []);
  const statuses = useMemo(
    () => Array.from(new Set(weapons.map((w) => w.status).filter(Boolean) as string[])).sort(),
    [],
  );

  const q = query.trim().toLowerCase();
  const list = weapons.filter((w) => {
    if (type !== "all" && w.type !== type) return false;
    if (status !== "all" && w.status !== status) return false;
    if (scaling !== "all" && !w.scaling?.[scaling as keyof typeof w.scaling]) return false;
    if (q && !w.name.toLowerCase().includes(q) && !(w.skill?.toLowerCase().includes(q) ?? false)) return false;
    return true;
  });

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search weapons by name or skill…"
          className="w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint focus:border-gold-faint focus:outline-none"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Select label="Type" value={type} onChange={setType} options={types} />
          <Select label="Status" value={status} onChange={setStatus} options={statuses} />
          <Select label="Scales with" value={scaling} onChange={setScaling} options={SCALING_STATS.map((s) => s.key)} labels={Object.fromEntries(SCALING_STATS.map((s) => [s.key, s.label]))} />
        </div>
      </div>

      <p className="mb-2 font-body text-xs text-parchment-faint">
        {list.length} of {weapons.length} weapons
      </p>

      {weapons.length === 0 ? (
        <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-10 text-center font-body text-parchment-muted">
          Weapon data not loaded yet.
        </p>
      ) : (
        <div className="frame overflow-x-auto rounded-lg">
          <table className="w-full border-collapse text-left font-body text-xs">
            <thead>
              <tr className="border-b border-night-600 bg-night-850 text-parchment-faint">
                <th className="sticky left-0 z-10 bg-night-850 px-3 py-2 font-semibold">Name</th>
                <th className="px-2 py-2 font-semibold">Type</th>
                {AP_COLUMNS.map((c) => (
                  <th key={c.key} className="px-2 py-2 text-right font-semibold">{c.label}</th>
                ))}
                {SCALING_STATS.map((s) => (
                  <th key={s.key} className="px-2 py-2 text-center font-semibold">{s.label}</th>
                ))}
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 font-semibold">Skill</th>
              </tr>
            </thead>
            <tbody>
              {list.map((w) => (
                <Row key={`${w.type}:${w.name}`} w={w} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 font-body text-xs text-parchment-faint">
        Scaling grades S–E; blank = no scaling. {WEAPON_CREDIT}.
      </p>
    </div>
  );
}

function Row({ w }: { w: Weapon }) {
  return (
    <tr className="border-b border-night-800/70 hover:bg-night-800/60">
      <td className="sticky left-0 z-10 bg-night-900 px-3 py-1.5 font-display font-semibold text-parchment">
        <span className="flex items-center gap-1.5">
          {w.rarity && (
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: RARITY_META[w.rarity].color }}
              title={RARITY_META[w.rarity].label}
            />
          )}
          {w.name}
        </span>
      </td>
      <td className="px-2 py-1.5 text-parchment-muted">{w.type}</td>
      {AP_COLUMNS.map((c) => {
        const v = w.ap?.[c.key];
        return (
          <td key={c.key} className="px-2 py-1.5 text-right tabular-nums text-parchment-muted">
            {v ? v : <span className="text-parchment-faint">–</span>}
          </td>
        );
      })}
      {SCALING_STATS.map((s) => {
        const g = w.scaling?.[s.key];
        return (
          <td key={s.key} className="px-2 py-1.5 text-center">
            {g ? <span className="font-semibold text-gold-dim">{g}</span> : <span className="text-parchment-faint">–</span>}
          </td>
        );
      })}
      <td className="px-2 py-1.5">
        {w.status ? (
          <span className="rounded border border-red-500/40 px-1.5 py-0.5 text-[0.65rem] text-red-300">{w.status}</span>
        ) : (
          <span className="text-parchment-faint">–</span>
        )}
      </td>
      <td className="px-2 py-1.5 text-parchment-muted">{w.skill ?? "–"}</td>
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-night-600 bg-night-900 px-2 py-1.5 font-body text-sm text-parchment focus:border-gold-faint focus:outline-none"
      >
        <option value="all">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}
