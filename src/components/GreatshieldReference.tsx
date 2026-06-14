"use client";

import { useEffect, useState } from "react";
import { greatshields } from "@/data/greatshields";
import {
  AFFINITY_COLOR,
  RANKED_AFFINITIES,
  STAT_ORDER,
  rankByAffinity,
  type Affinity,
  type Greatshield,
} from "@/lib/greatshields";
import { ShieldIcon } from "./ShieldIcon";

/** How many shields to show per affinity section. */
const TOP_N = 6;

/**
 * Guardian greatshield reference: shields grouped by affinity and ranked by
 * that affinity's guarded negation. Clicking a shield opens its full stat block.
 */
export function GreatshieldReference() {
  const [selected, setSelected] = useState<Greatshield | null>(null);

  // Escape closes the modal.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  if (greatshields.length === 0) {
    return (
      <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-10 text-center font-body text-parchment-muted">
        No greatshields recorded yet. Add entries to{" "}
        <code className="text-gold">src/data/greatshields.ts</code>.
      </p>
    );
  }

  return (
    <div className="space-y-9">
      {RANKED_AFFINITIES.map(({ key, label }) => {
        const ranked = rankByAffinity(greatshields, key, TOP_N);
        return (
          <section key={key}>
            <h3 className="eyebrow mb-3 flex items-center gap-2 text-gold-bright">
              <AffinityDot affinity={key} /> {label}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ranked.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelected(s)}
                  className="frame group flex items-center gap-3 rounded-lg bg-night-800 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-night-700 hover:shadow-lift"
                >
                  <ShieldIcon src={s.icon} alt={s.name} size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-parchment">
                      {s.name}
                    </p>
                    <p className="mt-0.5 font-body text-xs uppercase tracking-[0.05em] text-parchment-muted">
                      {label} neg.{" "}
                      <span className="font-semibold text-gold-bright">
                        {s.negation[key].toFixed(1)}
                      </span>
                    </p>
                  </div>
                  {i === 0 && (
                    <span className="self-start rounded bg-gold px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-night-950">
                      Best
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        );
      })}

      {selected && <ShieldModal shield={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ShieldModal({ shield, onClose }: { shield: Greatshield; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-[1px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={shield.name}
    >
      <div
        className="frame w-full max-w-sm rounded-lg bg-night-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 border-b border-night-600 pb-4">
          <ShieldIcon src={shield.icon} alt={shield.name} size={72} />
          <div className="min-w-0">
            <p className="eyebrow">Greatshield</p>
            <h3 className="font-display text-xl font-bold text-parchment">{shield.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto self-start text-lg leading-none text-parchment-faint transition-colors hover:text-gold"
          >
            ✕
          </button>
        </div>

        <p className="eyebrow mb-2 mt-4">Guarded Damage Negation</p>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
          {STAT_ORDER.map(({ key, label }) => (
            <StatRow key={key} label={label} value={shield.negation[key].toFixed(1)} />
          ))}
          <StatRow label="Guard Boost" value={String(shield.guardBoost)} />
        </dl>

        {shield.notes && (
          <p className="mt-4 font-body text-sm text-parchment-muted">{shield.notes}</p>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-night-700/60 py-1.5">
      <dt className="font-body text-sm text-parchment-muted">{label}</dt>
      <dd className="font-display text-sm font-semibold text-parchment">{value}</dd>
    </div>
  );
}

function AffinityDot({ affinity }: { affinity: Affinity }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ background: AFFINITY_COLOR[affinity] }}
    />
  );
}
