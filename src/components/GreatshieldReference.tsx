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

/** The Guardian's namesake shield, featured at the top. */
const GUARDIAN_ID = "guardians-greatshield";

/**
 * Guardian greatshield reference. Pick an affinity (Holy / Magic / Fire /
 * Lightning) and the shields ranked by that affinity's guarded negation are
 * shown — no scrolling through every affinity. Clicking a shield opens its
 * full stat block.
 */
export function GreatshieldReference() {
  const guardian = greatshields.find((s) => s.id === GUARDIAN_ID);
  const [affinity, setAffinity] = useState<Affinity>(RANKED_AFFINITIES[0].key);
  const [detail, setDetail] = useState<Greatshield | null>(null);

  // Escape closes the modal.
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDetail(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  if (greatshields.length === 0) {
    return (
      <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-10 text-center font-body text-parchment-muted">
        No greatshields recorded yet. Add entries to{" "}
        <code className="text-gold">src/data/greatshields.ts</code>.
      </p>
    );
  }

  const ranked = rankByAffinity(greatshields, affinity);
  const activeLabel = RANKED_AFFINITIES.find((a) => a.key === affinity)?.label ?? "";

  return (
    <div className="space-y-8">
      {guardian && <GuardianFeature shield={guardian} />}

      {/* Affinity selector */}
      <div>
        <p className="eyebrow mb-2">Filter by affinity</p>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {RANKED_AFFINITIES.map(({ key, label }) => {
            const isActive = key === affinity;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setAffinity(key)}
                aria-pressed={isActive}
                className={`frame flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 transition-all ${
                  isActive
                    ? "bg-night-700 shadow-lift"
                    : "bg-night-800 text-parchment-muted hover:bg-night-700"
                }`}
                style={isActive ? { borderColor: AFFINITY_COLOR[key], boxShadow: `0 0 0 1px ${AFFINITY_COLOR[key]}66` } : undefined}
              >
                <AffinityIcon
                  affinity={key}
                  color={isActive ? AFFINITY_COLOR[key] : undefined}
                />
                <span
                  className={`font-display text-sm font-semibold ${isActive ? "text-parchment" : ""}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shields for the selected affinity */}
      <div>
        <h3 className="eyebrow mb-3 text-gold-bright">
          {activeLabel} negation · best first
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setDetail(s)}
              className="frame group flex items-center gap-3 rounded-lg bg-night-800 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-night-700 hover:shadow-lift"
            >
              <ShieldIcon src={s.icon} alt={s.name} size={56} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-parchment">
                  {s.name}
                </p>
                <p className="mt-0.5 font-body text-xs uppercase tracking-[0.05em] text-parchment-muted">
                  {activeLabel} neg.{" "}
                  <span className="font-semibold text-gold-bright">
                    {s.negation[affinity].toFixed(1)}
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
      </div>

      {detail && <ShieldModal shield={detail} onClose={() => setDetail(null)} />}
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

function GuardianFeature({ shield }: { shield: Greatshield }) {
  return (
    <section className="frame rounded-lg bg-night-800 p-5">
      <div className="flex items-center gap-4 border-b border-night-600 pb-4">
        <ShieldIcon src={shield.icon} alt={shield.name} size={80} />
        <div className="min-w-0">
          <p className="eyebrow">Guardian · Base shield</p>
          <h3 className="font-display text-2xl font-bold text-parchment">{shield.name}</h3>
        </div>
      </div>

      <p className="eyebrow mb-2 mt-4">Guarded Damage Negation</p>
      <dl className="grid grid-cols-2 gap-x-8 sm:grid-cols-3">
        {STAT_ORDER.map(({ key, label }) => (
          <StatRow key={key} label={label} value={shield.negation[key].toFixed(1)} />
        ))}
        <StatRow label="Guard Boost" value={String(shield.guardBoost)} />
      </dl>
    </section>
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

/**
 * Affinity glyphs evoking the in-game damage symbols (original artwork):
 * Holy = radiant sun, Magic = glintstone sparkle, Fire = flame, Lightning = bolt.
 */
function AffinityIcon({ affinity, color }: { affinity: Affinity; color?: string }) {
  const style = { color: color ?? "var(--parchment-faint, #6f6a5c)" };
  const common = { viewBox: "0 0 24 24", className: "h-7 w-7", style, "aria-hidden": true } as const;

  switch (affinity) {
    case "holy":
      return (
        <svg {...common} fill="currentColor">
          <circle cx="12" cy="12" r="4" />
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.1 5.1l2.1 2.1M16.8 16.8l2.1 2.1M18.9 5.1l-2.1 2.1M7.2 16.8l-2.1 2.1" />
          </g>
        </svg>
      );
    case "magic":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2c.5 4.4 1.6 5.5 6 6-4.4.5-5.5 1.6-6 6-.5-4.4-1.6-5.5-6-6 4.4-.5 5.5-1.6 6-6z" />
          <path d="M18.5 13.5c.25 1.9.85 2.5 2.5 2.75-1.65.25-2.25.85-2.5 2.75-.25-1.9-.85-2.5-2.5-2.75 1.65-.25 2.25-.85 2.5-2.75z" />
        </svg>
      );
    case "fire":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2c2.6 3.3 4.3 5.4 4.3 8.6A4.3 4.3 0 0 1 12 22a4.3 4.3 0 0 1-4.3-4.3c0-1.4.5-2.5 1.4-3.6.1 1.2.8 2 1.9 2.3-.7-2.9.2-5.6 3-8.4-.3 1.7.2 3 1.3 3.9.3-3.2-.7-5.6-3.6-7.5z" />
        </svg>
      );
    case "lightning":
      return (
        <svg {...common} fill="currentColor">
          <path d="M13.5 2L5 13h5l-1.5 9L19 10h-5.5L15 2z" />
        </svg>
      );
    default:
      return null;
  }
}
