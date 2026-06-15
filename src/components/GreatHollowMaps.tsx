"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { greatHollowMaps, GREAT_HOLLOW_CREDIT } from "@/data/greatHollow";
import { ALL_SETS, candidateSets, type Crystal } from "@/lib/greatHollow";
import { asset } from "@/lib/assets";

/** Marker diameter as a percentage of the map width. Tune to your images. */
const MARKER_SIZE = 11;

type ClickReadout = { map: string; x: number; y: number };

/**
 * Two Great Hollow maps with clickable crystals. Click the crystals you can
 * see; the candidate set narrows to the intersection of what you've clicked
 * and non-matching crystals dim — across both maps, since the set is global.
 *
 * Calibration mode (toggle in the bar) overlays every marker with its label
 * and reads out the x/y% of wherever you click, for dialing in coordinates.
 */
export function GreatHollowMaps() {
  const [selected, setSelected] = useState<string[]>([]);
  const [calibrate, setCalibrate] = useState(false);
  const [lastClick, setLastClick] = useState<ClickReadout | null>(null);

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

  const readCoord = (e: React.MouseEvent<HTMLDivElement>, mapId: string) => {
    if (!calibrate) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    setLastClick({ map: mapId, x, y });
    // eslint-disable-next-line no-console
    console.log(`${mapId}  x: ${x}, y: ${y}`);
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
          {calibrate && lastClick
            ? `${lastClick.map}: x: ${lastClick.x}, y: ${lastClick.y}`
            : status}
        </p>
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => setCalibrate((v) => !v)}
            className={`font-body text-xs uppercase tracking-[0.08em] underline-offset-2 transition-colors hover:underline ${
              calibrate ? "text-gold" : "text-parchment-faint hover:text-gold"
            }`}
          >
            {calibrate ? "Calibrating…" : "Calibrate"}
          </button>
          {hasSelection && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="font-body text-xs uppercase tracking-[0.08em] text-parchment-faint underline-offset-2 transition-colors hover:text-gold hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Maps */}
      <div className="grid gap-6 lg:grid-cols-2">
        {greatHollowMaps.map((m) => (
          <figure key={m.id}>
            <figcaption className="eyebrow mb-2">{m.label}</figcaption>
            <div
              onClick={(e) => readCoord(e, m.id)}
              className={`relative overflow-hidden rounded-lg border border-night-600 bg-night-900 ${
                calibrate ? "cursor-crosshair" : ""
              }`}
            >
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
                    className={`absolute grid aspect-square -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-all duration-200 ${
                      calibrate
                        ? "pointer-events-none bg-gold/20 ring-2 ring-gold"
                        : active
                          ? sel
                            ? "bg-gold/10 ring-2 ring-gold"
                            : "ring-1 ring-white/20 hover:ring-2 hover:ring-gold"
                          : "bg-night-950/70 ring-1 ring-night-700 hover:bg-night-950/40"
                    }`}
                    style={{ left: `${c.x}%`, top: `${c.y}%`, width: `${MARKER_SIZE}%` }}
                  >
                    {calibrate && (
                      <span className="rounded bg-night-950/80 px-1 text-[0.6rem] font-bold leading-tight text-gold-bright">
                        {c.sets.join("/")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </figure>
        ))}
      </div>

      {calibrate && (
        <p className="mt-3 font-body text-xs text-parchment-faint">
          Calibration on: click a crystal to read its x/y% (also logged to the console).
          Gold rings show current marker positions.
        </p>
      )}

      <p className="mt-5 font-body text-xs text-parchment-faint">{GREAT_HOLLOW_CREDIT}</p>
    </div>
  );
}
