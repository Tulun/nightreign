"use client";

import { useState } from "react";
import { powerTiers } from "@/data/fieldBosses";
import { OUTCOME_COLOR, type FieldBossTier, type LootSlot } from "@/lib/fieldBosses";

/**
 * A loot-pool browser for a set of tiers (field bosses or POI bosses). Pick a
 * tier to see its bosses/POIs, per-slot drop chances, and dormant-power pool.
 */
export function FieldBossLoot({ tiers, note }: { tiers: FieldBossTier[]; note?: string }) {
  const [key, setKey] = useState(tiers[0]?.key ?? "");
  const tier = tiers.find((t) => t.key === key) ?? tiers[0];
  if (!tier) return null;

  return (
    <div>
      {/* Tier selector */}
      <div
        className="mb-6 grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${tiers.length}, minmax(0, 1fr))` }}
      >
        {tiers.map((t) => {
          const active = t.key === tier.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setKey(t.key)}
              aria-pressed={active}
              className={`frame rounded-lg px-2 py-3 font-display text-sm font-semibold transition-all ${
                active ? "bg-night-700 shadow-lift" : "bg-night-800 text-parchment-muted hover:bg-night-700"
              }`}
              style={active ? { borderColor: t.accent, boxShadow: `0 0 0 1px ${t.accent}66` } : undefined}
            >
              <span style={{ color: active ? t.accent : undefined }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tier.slots.length === 0 ? (
        <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-10 text-center font-body text-parchment-muted">
          {tier.poolLabel} not recorded yet.
        </p>
      ) : (
        <TierView tier={tier} />
      )}

      {note && <p className="mt-5 font-body text-xs text-parchment-faint">{note}</p>}
    </div>
  );
}

function TierView({ tier }: { tier: FieldBossTier }) {
  const pools = tier.powerTierKeys
    .map((k) => powerTiers.find((p) => p.key === k))
    .filter((p): p is (typeof powerTiers)[number] => Boolean(p));
  return (
    <div className="space-y-7">
      {tier.bosses.length > 0 && (
        <div>
          <h3 className="eyebrow mb-2" style={{ color: tier.accent }}>
            {tier.label}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {tier.bosses.map((b) => (
              <span
                key={b}
                className="rounded border border-night-600 bg-night-800 px-2 py-0.5 font-body text-xs text-parchment"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-5">
        <h3 className="eyebrow" style={{ color: tier.accent }}>
          {tier.poolLabel}
        </h3>
        {tier.slots.map((slot) => (
          <Slot key={slot.name} slot={slot} />
        ))}
      </div>

      {tier.extraInfo && (
        <div>
          <h3 className="eyebrow mb-2" style={{ color: tier.accent }}>
            {tier.extraInfo.label} · bonus drops
          </h3>
          <div className="space-y-1.5">
            {tier.extraInfo.drops.map((d) => (
              <div
                key={d.name}
                className="relative h-6 w-full overflow-hidden rounded border border-night-700 bg-night-900"
              >
                <div
                  className="absolute inset-y-0 left-0"
                  style={{ width: `${Math.max(d.chance, 2)}%`, backgroundColor: OUTCOME_COLOR.legendary, opacity: 0.5 }}
                />
                <span className="absolute inset-0 flex items-center px-2 font-body text-xs text-parchment">
                  <span className="w-12 shrink-0 font-semibold tabular-nums">{d.chance}%</span>
                  {d.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pools.map((power) => (
        <div key={power.key}>
          <h3 className="eyebrow mb-2" style={{ color: tier.accent }}>
            {power.label} (power slot pool)
          </h3>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {power.powers.map((p) => (
              <span
                key={p}
                className="rounded border border-night-700 bg-night-800/60 px-2.5 py-1 font-body text-xs text-parchment-muted"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Slot({ slot }: { slot: LootSlot }) {
  return (
    <div>
      <p className="mb-1.5 font-display text-sm font-semibold text-parchment">{slot.name}</p>
      <div className="space-y-1.5">
        {slot.outcomes.map((o) => (
          <div
            key={o.label}
            className="relative h-6 w-full overflow-hidden rounded border border-night-700 bg-night-900"
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{ width: `${o.chance}%`, backgroundColor: OUTCOME_COLOR[o.kind], opacity: 0.5 }}
            />
            <span className="absolute inset-0 flex items-center px-2 font-body text-xs text-parchment">
              <span className="w-12 shrink-0 font-semibold tabular-nums">{o.chance}%</span>
              {o.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
