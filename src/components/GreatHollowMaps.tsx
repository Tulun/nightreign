"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { greatHollowMaps, GREAT_HOLLOW_CREDIT } from "@/data/greatHollow";
import { ALL_SETS, candidateSets, type Crystal } from "@/lib/greatHollow";
import { asset } from "@/lib/assets";

/** Marker diameter as a percentage of the map width. Tune to your images. */
const MARKER_SIZE = 11;

/**
 * Two Great Hollow maps with clickable crystals. Click the crystals you can
 * see; the candidate set narrows to the intersection of what you've clicked
 * and non-matching crystals dim — across both maps, since the set is global.
 */
export function GreatHollowMaps() {
  const [selected, setSelected] = useState<string[]>([]);

  const allCrystals = useMemo(() => greatHollowMaps.flatMap((m) => m.crystals), []);
  const observed = useMemo(
    () => allCrystals.filter((c) => selected.includes(c.id)),
    [allCrystals, selected],
  );
  const candidates = useMemo(() => candidateSets(observed), [observed]);

  const hasSelection = selected.length > 0;
  const contradictory = hasSelection && candidates.length === 0;

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const isActive = (c: Crystal) => {
    if (!hasSelection) return true;
    if (candidates.length === 0) return selected.includes(c.id);
    return c.sets.some((s) => candidates.includes(s));
  };

  let status: string;
  if (!hasSelection) status = "Tap the crystals you can see — the maps dim to the matching set.";
  else if (contradictory) status = "Those crystals don’t share a set. Reset and try again.";
  else if (candidates.length === 1) status = `Confirmed — Set ${candidates[0]}`;
  else status = `Possible sets: ${candidates.join(" · ")}`;

  return (
    <div>
      {/* Status / candidate sets */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-night-600 bg-night-800/60 px-4 py-3">
        <div className="flex gap-1.5">
          {ALL_SETS.map((s) => {
            const on = candidates.includes(s);
            return (
              <span
                key={s}
                className={`grid h-7 w-7 place-items-center rounded-full border font-display text-sm font-bold ${
                  on
                    ? "border-gold bg-gold/15 text-gold-bright"
                    : "border-night-600 text-parchment-faint"
                }`}
              >
                {s}
              </span>
            );
          })}
        </div>
        <p className={`font-body text-sm ${contradictory ? "text-red-300" : "text-parchment-muted"}`}>
          {status}
        </p>
        {hasSelection && (
          <button
            type="button"
            onClick={() => setSelected([])}
            className="ml-auto font-body text-xs uppercase tracking-[0.08em] text-parchment-faint underline-offset-2 transition-colors hover:text-gold hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* Maps */}
      <div className="grid gap-6 lg:grid-cols-2">
        {greatHollowMaps.map((m) => (
          <figure key={m.id}>
            <figcaption className="eyebrow mb-2">{m.label}</figcaption>
            <div className="relative overflow-hidden rounded-lg border border-night-600 bg-night-900">
              <Image
                src={asset(m.image)}
                alt={`Great Hollow ${m.label}`}
                width={m.width}
                height={m.height}
                className="block h-auto w-full select-none"
                priority={m.id === "surface"}
              />
              {m.crystals.map((c) => {
                const active = isActive(c);
                const sel = selected.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    aria-pressed={sel}
                    aria-label={`Crystal ${c.sets.join("/")}${sel ? ", selected" : ""}`}
                    title={c.sets.join("/")}
                    className={`absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${
                      active
                        ? sel
                          ? "bg-gold/10 ring-2 ring-gold"
                          : "ring-1 ring-white/20 hover:ring-2 hover:ring-gold"
                        : "bg-night-950/70 ring-1 ring-night-700 hover:bg-night-950/40"
                    }`}
                    style={{ left: `${c.x}%`, top: `${c.y}%`, width: `${MARKER_SIZE}%` }}
                  />
                );
              })}
            </div>
          </figure>
        ))}
      </div>

      <p className="mt-5 font-body text-xs text-parchment-faint">{GREAT_HOLLOW_CREDIT}</p>
    </div>
  );
}
