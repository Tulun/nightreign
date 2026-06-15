"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
 * Icon path for a shield: an explicit `icon` override, else derived from the
 * id. Drop `/public/icons/greatshields/<id>.png` and it loads automatically;
 * until then ShieldIcon falls back to the placeholder glyph.
 */
function iconSrc(shield: Greatshield) {
  return shield.icon ?? `/icons/greatshields/${shield.id}.png`;
}

/**
 * Guardian greatshield reference. Pick an affinity (Holy / Magic / Fire /
 * Lightning) and the shields ranked by that affinity's guarded negation are
 * shown — no scrolling through every affinity. Clicking a shield opens its
 * full stat block.
 */
export function GreatshieldReference() {
  const guardian = greatshields.find((s) => s.id === GUARDIAN_ID);
  const [view, setView] = useState<Affinity | "all">(RANKED_AFFINITIES[0].key);
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

  // "all" lists every shield A–Z; an affinity lists shields that meet or beat
  // the Guardian's Greatshield for that element (excluding the Guardian),
  // best first.
  const elementKey = view === "all" ? undefined : view;
  const activeLabel = RANKED_AFFINITIES.find((a) => a.key === view)?.label ?? "";
  const threshold = elementKey && guardian ? guardian.negation[elementKey] : undefined;
  const list = elementKey
    ? rankByAffinity(greatshields, elementKey).filter(
        (s) => s.id !== GUARDIAN_ID && (threshold === undefined || s.negation[elementKey] >= threshold),
      )
    : [...greatshields].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      {guardian && <GuardianFeature shield={guardian} />}

      {/* View selector */}
      <div>
        <p className="eyebrow mb-2">View</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
          {[...RANKED_AFFINITIES, { key: "all" as const, label: "All" }].map(({ key, label }) => {
            const isActive = key === view;
            const accent = key === "all" ? "#c9a227" : AFFINITY_COLOR[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                aria-pressed={isActive}
                className={`frame flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 transition-all ${
                  isActive
                    ? "bg-night-700 shadow-lift"
                    : "bg-night-800 text-parchment-muted hover:bg-night-700"
                }`}
                style={isActive ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}66` } : undefined}
              >
                {key === "all" ? (
                  <AllIcon active={isActive} />
                ) : (
                  <AffinityIcon affinity={key} active={isActive} />
                )}
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

      {/* Shields list */}
      <div>
        {elementKey ? (
          <>
            <h3 className="eyebrow text-gold-bright">
              {activeLabel} negation ≥ Guardian
              {threshold !== undefined ? ` · ${threshold.toFixed(1)}` : ""}
            </h3>
            <p className="mb-3 mt-1 font-body text-xs text-parchment-faint">
              Greatshields at least as strong as the Guardian&rsquo;s Greatshield against {activeLabel}, best first.
            </p>
          </>
        ) : (
          <>
            <h3 className="eyebrow text-gold-bright">All greatshields · A&ndash;Z</h3>
            <p className="mb-3 mt-1 font-body text-xs text-parchment-faint">
              Every greatshield, alphabetical. Showing guard boost; tap for the full stat block.
            </p>
          </>
        )}
        {list.length === 0 ? (
          <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-8 text-center font-body text-parchment-muted">
            No other greatshield matches or beats the Guardian&rsquo;s Greatshield against {activeLabel}.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setDetail(s)}
                className="frame group flex items-center gap-3 rounded-lg bg-night-800 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-night-700 hover:shadow-lift"
              >
                <ShieldIcon src={iconSrc(s)} alt={s.name} size={56} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-parchment">
                    {s.name}
                  </p>
                  <p className="mt-0.5 font-body text-xs uppercase tracking-[0.05em] text-parchment-muted">
                    {elementKey ? (
                      <>
                        {activeLabel} neg.{" "}
                        <span className="font-semibold text-gold-bright">
                          {s.negation[elementKey].toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <>
                        Guard boost{" "}
                        <span className="font-semibold text-gold-bright">{s.guardBoost}</span>
                      </>
                    )}
                  </p>
                </div>
                {elementKey && i === 0 && (
                  <span className="self-start rounded bg-gold px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-night-950">
                    Best
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
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
          <ShieldIcon src={iconSrc(shield)} alt={shield.name} size={72} />
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
        <ShieldIcon src={iconSrc(shield)} alt={shield.name} size={80} />
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

/** Affinity icons added under public/icons/elements (keyed by affinity). */
const AFFINITY_ICON: Partial<Record<Affinity, string>> = {
  holy: "/icons/elements/holy-affinity.png",
  magic: "/icons/elements/magic-affinity.png",
  fire: "/icons/elements/fire-affinity.png",
  lightning: "/icons/elements/lightning-affinity.png",
};

function AffinityIcon({ affinity, active }: { affinity: Affinity; active: boolean }) {
  const src = AFFINITY_ICON[affinity];
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={`${affinity} affinity`}
      width={32}
      height={32}
      className={`h-8 w-8 rounded object-contain transition-opacity ${active ? "opacity-100" : "opacity-60"}`}
    />
  );
}

/** Glyph for the "All" view — a 2×2 grid representing every shield. */
function AllIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className={`h-8 w-8 transition-opacity ${active ? "text-gold-bright opacity-100" : "text-parchment-faint opacity-60"}`}
    >
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}
