"use client";

import Image from "next/image";
import { useState } from "react";
import { characterSwaps, SWAP_NOTE, SWAP_CREDIT } from "@/data/statSwaps";
import { asset } from "@/lib/assets";
import {
  SCENE_META,
  SWAP_STAT_COLUMNS,
  relicIcon,
  type SwapRelic,
  type SwapStatKey,
  type SwapStats,
} from "@/lib/statSwaps";

/** Down-side display names (HP/FP/STM map back to the attribute that drops). */
const DOWN_NAME: Record<SwapStatKey, string> = {
  hp: "VIG", fp: "MND", stm: "END", str: "STR", dex: "DEX", int: "INT", fai: "FTH", arc: "ARC",
};

/** Chart units per attribute point (hp=vigor×20, fp=mind×5, stm=endurance×2). */
const UNITS_PER_POINT: Partial<Record<SwapStatKey, number>> = { hp: 20, fp: 5, stm: 2 };

/** The relic's flat bonus as in-game attribute text, e.g. "VIG +3 · MND +3". */
function bonusText(bonus: Partial<SwapStats>): string {
  return SWAP_STAT_COLUMNS.filter((col) => bonus[col.key])
    .map((col) => `${DOWN_NAME[col.key]} +${(bonus[col.key] ?? 0) / (UNITS_PER_POINT[col.key] ?? 1)}`)
    .join(" · ");
}

/**
 * Pick a Nightfarer to contrast their relic stat-swap options against Default.
 * Shows each swap, plus a "Both" row combining them, with bracketed deltas and
 * the stats each one lowers. Clicking a swap's signboard relic marks it
 * equipped, adding that relic's flat bonus stats on top of the swap.
 */
export function StatSwaps() {
  const [name, setName] = useState(characterSwaps[0].name);
  // Equipped signboard relics, per character, per swap index.
  const [equipped, setEquipped] = useState<Record<string, boolean[]>>({});
  const character = characterSwaps.find((c) => c.name === name) ?? characterSwaps[0];
  const base = character.base;
  const worn = equipped[name] ?? character.swaps.map(() => false);

  const toggleRelic = (index: number) =>
    setEquipped((prev) => {
      const next = [...(prev[name] ?? character.swaps.map(() => false))];
      next[index] = !next[index];
      return { ...prev, [name]: next };
    });

  // Displayed value for one swap+stat, honoring that swap's equipped relic.
  const swapValue = (swapIndex: number, key: SwapStatKey) => {
    const swap = character.swaps[swapIndex];
    return swap.stats[key] - (worn[swapIndex] ? 0 : swap.bonus[key] ?? 0);
  };

  // Each swap's displayed statline, plus a combined "Both" line (sum of deltas).
  const rows: { label: string; values: SwapStats; relic?: SwapRelic; equipped?: boolean }[] =
    character.swaps.map((swap, i) => ({
      label: swap.label,
      relic: swap.relic,
      equipped: worn[i],
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

      {/* Signboard relics — click to equip */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {character.swaps.map((swap, i) => (
          <RelicButton
            key={swap.label}
            relic={swap.relic}
            label={swap.label}
            bonus={bonusText(swap.bonus)}
            equipped={worn[i]}
            onClick={() => toggleRelic(i)}
          />
        ))}
        <span className="font-body text-xs text-parchment-faint">
          {worn.some(Boolean)
            ? "Equipped relics include their bonus stats"
            : "Click a relic to equip it"}
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
                    <div className="flex items-center gap-1.5 font-body text-parchment-muted">
                      {row.relic && row.equipped && (
                        <span
                          aria-hidden="true"
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: row.relic.scene ? SCENE_META[row.relic.scene].hex : "#c9a227" }}
                        />
                      )}
                      {row.label}
                    </div>
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

/** Clickable signboard relic: colored frame + scene icon, dimmed until equipped. */
function RelicButton({
  relic,
  label,
  bonus,
  equipped,
  onClick,
}: {
  relic: SwapRelic;
  label: string;
  bonus: string;
  equipped: boolean;
  onClick: () => void;
}) {
  const meta = relic.scene ? SCENE_META[relic.scene] : null;
  // Unknown-look relics highlight in the site gold instead of a drab gray.
  const hue = meta?.hex ?? "#c9a227";
  const sceneName = relic.scene
    ? `Grand ${relic.scene.charAt(0).toUpperCase()}${relic.scene.slice(1)} Scene (${meta?.color})`
    : "Relic look unconfirmed";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={equipped}
      title={sceneName}
      className={`frame flex items-center gap-3 rounded-md py-2 pl-2 pr-5 font-body text-base transition-colors ${
        equipped
          ? "bg-night-700 text-gold-bright"
          : "bg-night-800 text-parchment-muted hover:bg-night-700 hover:text-parchment"
      }`}
      style={equipped ? { borderColor: hue } : undefined}
    >
      <span
        className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded bg-night-900"
        style={{
          backgroundColor: equipped ? `${hue}59` : undefined,
          boxShadow: `inset 0 0 0 1px ${hue}${equipped ? "" : "66"}`,
        }}
      >
        <Image
          src={asset(relicIcon(relic))}
          alt={sceneName}
          fill
          sizes="64px"
          className={`object-contain p-0.5 transition-[filter,opacity] ${
            relic.scene
              ? equipped
                ? ""
                : "opacity-55 grayscale-[35%]"
              : "opacity-45 grayscale"
          }`}
        />
        {!relic.scene && (
          <span className="absolute font-display text-base font-bold text-parchment-faint">?</span>
        )}
      </span>
      <span className="flex flex-col items-start leading-snug">
        <span>{label}</span>
        <span className="text-sm tabular-nums text-parchment-muted">{bonus}</span>
        <span className="text-sm text-parchment-faint">
          {relic.scene ? `${meta?.color} relic` : "look unknown"}
        </span>
      </span>
    </button>
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
