"use client";

import { useState } from "react";
import { characterSwaps, SWAP_NOTE, SWAP_CREDIT } from "@/data/statSwaps";
import { SWAP_STAT_COLUMNS } from "@/lib/statSwaps";

/**
 * Pick a Nightfarer to contrast their relic stat-swap options against their
 * Default line. Changed cells show the new value with the delta in brackets.
 */
export function StatSwaps() {
  const [name, setName] = useState(characterSwaps[0].name);
  const character = characterSwaps.find((c) => c.name === name) ?? characterSwaps[0];

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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-sm">
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
                  {character.base[col.key]}
                </td>
              ))}
            </tr>
            {character.swaps.map((swap) => (
              <tr key={swap.label} className="border-b border-night-800">
                <td className="px-2 py-2 font-body text-parchment-muted">{swap.label}</td>
                {SWAP_STAT_COLUMNS.map((col) => (
                  <SwapCell
                    key={col.key}
                    value={swap.stats[col.key]}
                    base={character.base[col.key]}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 font-body text-xs text-parchment-faint">{SWAP_NOTE}</p>
      <p className="mt-1 font-body text-xs text-parchment-faint">{SWAP_CREDIT}</p>
    </div>
  );
}

function SwapCell({ value, base }: { value: number; base: number }) {
  const delta = value - base;
  if (delta === 0) {
    return <td className="px-2 py-2 text-right font-display tabular-nums text-parchment-faint">{value}</td>;
  }
  const up = delta > 0;
  return (
    <td className={`px-2 py-2 text-right font-display tabular-nums ${up ? "text-emerald-300" : "text-red-300"}`}>
      {value}
      <span className="ml-1 text-[0.7rem]">({up ? "+" : "−"}{Math.abs(delta)})</span>
    </td>
  );
}
