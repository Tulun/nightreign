"use client";

import { useState } from "react";
import { bosses } from "@/data/bosses";
import {
  BOSS_CATEGORIES,
  BOSS_CREDIT,
  type Boss,
  type BossCategory,
  type NegationKey,
  type Resist,
  type StatusKey,
} from "@/lib/bosses";
import { NEGATION_COLUMNS, STATUS_COLUMNS } from "@/lib/nightlords";

const DAMAGE_LABEL: Record<NegationKey, string> = {
  standard: "Standard",
  slash: "Slash",
  strike: "Strike",
  pierce: "Pierce",
  magic: "Magic",
  fire: "Fire",
  lightning: "Lightning",
  holy: "Holy",
};

export function BossCodex() {
  const [cat, setCat] = useState<BossCategory>("night1");
  const [selected, setSelected] = useState<Boss | null>(null);

  const list = bosses.filter((b) => b.categories.includes(cat));

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        {BOSS_CATEGORIES.map((c) => {
          const active = c.key === cat;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              aria-pressed={active}
              className={`frame rounded-lg px-2 py-3 font-display text-sm font-semibold transition-all ${
                active ? "bg-night-700 text-gold-bright shadow-lift" : "bg-night-800 text-parchment-muted hover:bg-night-700"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-10 text-center font-body text-parchment-muted">
          No bosses recorded for this tab yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelected(b)}
              className="frame group rounded-lg bg-night-800 p-3 text-left transition-all hover:bg-night-700"
            >
              <h3 className="font-display text-base font-semibold text-parchment group-hover:text-gold-bright">
                {b.name}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">Weak</span>
                {b.weakTo.length > 0 ? (
                  b.weakTo.map((w) => (
                    <span key={w} className="rounded border border-red-500/50 px-1.5 py-0.5 font-body text-[0.65rem] text-red-300">
                      {DAMAGE_LABEL[w]}
                    </span>
                  ))
                ) : (
                  <span className="font-body text-[0.65rem] text-parchment-faint">—</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="mt-6 font-body text-xs text-parchment-faint">
        Click a boss for full combat info. Negation = % of damage blocked; negative = weakness, higher = stronger
        resist. {BOSS_CREDIT}.
      </p>

      {selected && <BossDetail boss={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function BossDetail({ boss, onClose }: { boss: Boss; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${boss.name} combat info`}
    >
      <div
        className="frame my-auto w-full max-w-2xl rounded-xl bg-night-850 p-5 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-bold text-parchment">{boss.name}</h3>
            {boss.quote && (
              <p className="mt-1 max-w-prose font-body text-sm italic text-parchment-faint">“{boss.quote}”</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded text-parchment-faint transition-colors hover:text-gold"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Where found */}
        {(boss.spawnsIn || boss.locations) && (
          <div className="mt-3">
            <p className="eyebrow mb-1.5">{boss.spawnsIn ? "Appears in" : "Locations"}</p>
            <div className="flex flex-wrap gap-1.5">
              {(boss.spawnsIn ?? boss.locations ?? []).map((s) => (
                <span key={s} className="rounded border border-night-600 bg-night-800 px-2 py-0.5 font-body text-xs text-parchment">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Combat summary */}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-body text-sm text-parchment-muted">
          {typeof boss.stance === "number" && (
            <span><span className="text-parchment-faint">Stance</span> <span className="font-semibold text-parchment">{boss.stance}</span></span>
          )}
          {typeof boss.parryable === "boolean" && (
            <span><span className="text-parchment-faint">Parryable</span> <span className="font-semibold text-parchment">{boss.parryable ? "Yes" : "No"}</span></span>
          )}
          {boss.damageDealt && boss.damageDealt.length > 0 && (
            <span>
              <span className="text-parchment-faint">Deals</span>{" "}
              <span className="font-semibold text-parchment">{boss.damageDealt.map((d) => DAMAGE_LABEL[d]).join(", ")}</span>
            </span>
          )}
        </div>

        {/* Negations */}
        <div className="mt-4">
          <p className="eyebrow mb-2">Negations / Absorptions</p>
          <div className="grid grid-cols-4 gap-1.5">
            {NEGATION_COLUMNS.map((col) => {
              const v = boss.negations[col.key];
              const cls =
                v < 0
                  ? "border-red-500/60 text-red-300"
                  : v > 20
                    ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                    : v > 0
                      ? "border-night-600 text-parchment-faint"
                      : "border-night-700 text-parchment-muted";
              return (
                <div key={col.key} className={`rounded border ${cls} px-1.5 py-1 text-center`}>
                  <div className="font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">{col.label}</div>
                  <div className="font-display text-sm font-semibold tabular-nums">{v > 0 ? `+${v}` : v}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resistances */}
        <div className="mt-4">
          <p className="eyebrow mb-2">Status Resistances</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_COLUMNS.map((col) => (
              <ResistChip key={col.key} label={col.label} value={boss.resistances[col.key]} />
            ))}
          </div>
        </div>

        {/* Weak / Strong summary */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="eyebrow mb-1.5 text-red-300">Weak to</p>
            <div className="flex flex-wrap gap-1.5">
              {boss.weakTo.length > 0 ? (
                boss.weakTo.map((w) => (
                  <span key={w} className="rounded border border-red-500/50 px-2 py-0.5 font-body text-xs text-red-300">
                    {DAMAGE_LABEL[w]}
                  </span>
                ))
              ) : (
                <span className="font-body text-xs text-parchment-faint">No damage-type weakness</span>
              )}
            </div>
          </div>
          <div>
            <p className="eyebrow mb-1.5 text-sky-300">Stronger vs</p>
            <div className="flex flex-wrap gap-1.5">
              {boss.strongerVs.length > 0 ? (
                boss.strongerVs.map((w) => (
                  <span key={w} className="rounded border border-sky-500/40 px-2 py-0.5 font-body text-xs text-sky-300">
                    {DAMAGE_LABEL[w]}
                  </span>
                ))
              ) : (
                <span className="font-body text-xs text-parchment-faint">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Drops */}
        {boss.drops && boss.drops.length > 0 && (
          <div className="mt-4">
            <p className="eyebrow mb-2">Rune Drops</p>
            <div className="space-y-1.5">
              {boss.drops.map((d) => (
                <div key={d.source} className="rounded border border-night-700 bg-night-900/50 px-3 py-1.5 font-body text-xs text-parchment-muted">
                  <span className="font-semibold text-parchment">{d.source}</span>
                  {d.reward && <span className="text-gold-dim"> · {d.reward}</span>}
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-parchment-faint">
                    {typeof d.solo === "number" && <span>Solo {d.solo.toLocaleString()}</span>}
                    {typeof d.duo === "number" && <span>Duo {d.duo.toLocaleString()}</span>}
                    {typeof d.trio === "number" && <span>Trio {d.trio.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {boss.note && <p className="mt-4 font-body text-sm text-parchment-muted">{boss.note}</p>}
      </div>
    </div>
  );
}

function ResistChip({ label, value }: { label: string; value: Resist }) {
  if (value === null) return null;
  const immune = value === "Immune";
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-body text-[0.7rem] ${
        immune ? "border-gold-faint text-gold" : "border-night-700 text-parchment-muted"
      }`}
    >
      {label} <span className="font-semibold">{immune ? "Imm" : value}</span>
    </span>
  );
}
