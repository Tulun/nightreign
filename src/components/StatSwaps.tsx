"use client";

import { useState } from "react";
import { characterSwaps, SWAP_NOTE, SWAP_CREDIT } from "@/data/statSwaps";
import { SWAP_STAT_COLUMNS, type SwapStatKey, type SwapStats } from "@/lib/statSwaps";

/** Down-side display names (HP/FP/STM map back to the attribute that drops). */
const DOWN_NAME: Record<SwapStatKey, string> = {
  hp: "VIG", fp: "MND", stm: "END", str: "STR", dex: "DEX", int: "INT", fai: "FTH", arc: "ARC",
};

/**
 * Pick a Nightfarer to contrast their relic stat-swap options against Default.
 * Shows each swap, plus a "Both" row combining them, with bracketed deltas and
 * the stats each one lowers. The "Signboard relics" toggle adds the relics'
 * flat bonus stats on top of the swap.
 */
export function StatSwaps() {
  const [name, setName] = useState(characterSwaps[0].name);
  const [withRelics, setWithRelics] = useState(false);
  const character = characterSwaps.find((c) => c.name === name) ?? characterSwaps[0];
  const base = character.base;

  // Displayed value for one swap+stat, honoring the relic toggle.
  const swapValue = (swapIndex: number, key: SwapStatKey) => {
    const swap = character.swaps[swapIndex];
    return swap.stats[key] - (withRelics ? 0 : swap.bonus[key] ?? 0);
  };

  // Each swap's displayed statline, plus a combined "Both" line (sum of deltas).
  const rows = character.swaps.map((swap, i) => ({
    label: swap.label,
    values: buildStats((key) => swapValue(i, key)),
  }));
  const both = buildStats((key) =>
    base[key] + character.swaps.reduce((sum, _s, i) => sum + (swapValue(i, key) - base[key]), 0),
  );
  rows.push({ label: character.swaps.map((s) => s.label).join(" + "), values: both });

  return (
    <div>
      {/* Character selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {characterSwaps.map((c) => {
          const active = c.name === name;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => setName(c.name)}
              aria-pressed={active}
              className={`frame rounded-md px-3 py-1.5 font-body text-sm transition-colors ${
                active
                  ? "bg-night-700 text-gold-bright"
                  : "bg-night-800 text-parchment-muted hover:bg-night-700 hover:text-parchment"
              }`}
              style={active ? { borderColor: "#c9a227" } : undefined}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Signboard relic toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setWithRelics((v) => !v)}
          aria-pressed={withRelics}
          className={`frame rounded-md px-3 py-1.5 font-body text-sm transition-colors ${
            withRelics
              ? "bg-night-700 text-gold-bright"
              : "bg-night-800 text-parchment-muted hover:bg-night-700 hover:text-parchment"
          }`}
          style={withRelics ? { borderColor: "#c9a227" } : undefined}
        >
          Signboard relics {withRelics ? "✓" : ""}
        </button>
        <span className="font-body text-xs text-parchment-faint">
          {withRelics ? "Relic bonus stats included" : "Relic-free default values"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-night-600">
              <th className="px-2 py-2 text-left font-body text-xs uppercase tracking-wide text-parchment-faint">
                Option
              </th>
              {SWAP_STAT_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-2 text-right font-body text-xs uppercase tracking-wide text-parchment-faint"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-night-700 bg-night-800/60">
              <td className="px-2 py-2 font-display font-semibold text-gold-bright">Default</td>
              {SWAP_STAT_COLUMNS.map((col) => (
                <td key={col.key} className="px-2 py-2 text-right font-display tabular-nums text-parchment">
                  {base[col.key]}
                </td>
              ))}
            </tr>
            {rows.map((row) => {
              const downs = SWAP_STAT_COLUMNS.filter((c) => row.values[c.key] < base[c.key]).map(
                (c) => DOWN_NAME[c.key],
              );
              return (
                <tr key={row.label} className="border-b border-night-800">
                  <td className="px-2 py-2 align-top">
                    <div className="font-body text-parchment-muted">{row.label}</div>
                    {downs.length > 0 && (
                      <div className="mt-0.5 font-body text-[0.65rem] text-red-300/80">
                        ↓ {downs.join(", ")}
                      </div>
                    )}
                  </td>
                  {SWAP_STAT_COLUMNS.map((col) => (
                    <SwapCell key={col.key} value={row.values[col.key]} base={base[col.key]} />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 font-body text-xs text-parchment-faint">{SWAP_NOTE}</p>
      <p className="mt-1 font-body text-xs text-parchment-faint">{SWAP_CREDIT}</p>
    </div>
  );
}

/** Build a full SwapStats from a per-key producer. */
function buildStats(fn: (key: SwapStatKey) => number): SwapStats {
  const out = {} as SwapStats;
  for (const col of SWAP_STAT_COLUMNS) out[col.key] = fn(col.key);
  return out;
}

function SwapCell({ value, base }: { value: number; base: number }) {
  const delta = value - base;
  if (delta === 0) {
    return <td className="px-2 py-2 text-right align-top font-display tabular-nums text-parchment-faint">{value}</td>;
  }
  const up = delta > 0;
  return (
    <td className={`px-2 py-2 text-right align-top font-display tabular-nums ${up ? "text-emerald-300" : "text-red-300"}`}>
      {value}
      <span className="ml-1 text-[0.7rem]">({up ? "+" : "−"}{Math.abs(delta)})</span>
    </td>
  );
}
