"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { nightlords, NIGHTLORD_CREDIT } from "@/data/nightlords";
import { everdarkStatStubs, nightlordStats, NIGHTLORD_STAT_MAP } from "@/data/nightlordStats";
import { bosses } from "@/data/bosses";
import type { BossCategory } from "@/lib/bosses";
import { WEAKNESS, type Nightlord, type WeaknessElement } from "@/lib/nightlords";
import {
  NIGHTLORD_DEPTH_BUFFS,
  NIGHTLORD_STATS_CREDIT,
  STAT_NEGATION_COLUMNS,
  STAT_STATUS_COLUMNS,
  TEAM_OPTIONS,
  type NightlordStatRow,
  type StatVariant,
  type TeamSize,
} from "@/lib/nightlordStats";
import { asset } from "@/lib/assets";
import { StatIcon } from "@/components/StatIcon";

/** Depths of Night boost applied to the display, or null when off. */
type DepthBuff = (typeof NIGHTLORD_DEPTH_BUFFS)[number] | null;

const VARIANT_TABS: { key: StatVariant; label: string; hint: string }[] = [
  { key: "normal", label: "Nightlords", hint: "Standard expeditions" },
  { key: "everdark", label: "Everdark Sovereigns", hint: "Empowered variants" },
];

/** The Nightlords with weaknesses, full stat tables, and expedition info. */
export function Nightlords() {
  const [variant, setVariant] = useState<StatVariant>("normal");
  const [team, setTeam] = useState<TeamSize>("trio");
  const [depth, setDepth] = useState<number>(0); // 0 = off, 1–5 = DoN depth

  const table = nightlordStats.find((t) => t.variant === variant && t.team === team);
  const depthBuff: DepthBuff = depth > 0 ? NIGHTLORD_DEPTH_BUFFS[depth - 1] : null;

  const shown = nightlords.filter((nl) => NIGHTLORD_STAT_MAP[nl.id]?.[variant]);
  const standard = shown.filter((nl) => !nl.phases);
  const finals = shown.filter((nl) => nl.phases);

  return (
    <div>
      {/* Normal / Everdark tabs */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3">
        {VARIANT_TABS.map((t) => {
          const active = t.key === variant;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setVariant(t.key)}
              aria-pressed={active}
              className={`frame rounded-lg px-2 py-3 text-center transition-all ${
                active ? "bg-night-700 shadow-lift" : "bg-night-800 hover:bg-night-700"
              }`}
            >
              <span
                className={`block font-display text-sm font-semibold ${
                  active
                    ? t.key === "everdark"
                      ? "text-red-300"
                      : "text-gold-bright"
                    : "text-parchment-muted"
                }`}
              >
                {t.label}
              </span>
              <span className="mt-0.5 block font-body text-[0.65rem] text-parchment-faint">{t.hint}</span>
            </button>
          );
        })}
      </div>

      {/* Team size & Depths of Night controls */}
      <div className="frame mb-6 rounded-lg bg-night-800 p-4">
        <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
          <div>
            <p className="mb-1.5 font-body text-[0.65rem] font-semibold uppercase tracking-wide text-parchment-faint">
              Players <span className="normal-case tracking-normal">(HP scales)</span>
            </p>
            <div className="flex gap-1.5">
              {TEAM_OPTIONS.map((opt) => (
                <Pill key={opt.key} active={team === opt.key} onClick={() => setTeam(opt.key)}>
                  {opt.players}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 font-body text-[0.65rem] font-semibold uppercase tracking-wide text-parchment-faint">
              Depths of Night modifier
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Pill active={depth === 0} onClick={() => setDepth(0)}>
                Off
              </Pill>
              {NIGHTLORD_DEPTH_BUFFS.map((d) => (
                <Pill key={d.depth} active={depth === d.depth} onClick={() => setDepth(d.depth)}>
                  Depth {d.depth}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {depthBuff && (
          <p className="mt-3 border-t border-night-700 pt-3 font-body text-xs text-parchment-muted">
            <span className="font-semibold text-gold">Depth {depthBuff.depth}:</span> Nightlord HP{" "}
            <span className="font-semibold text-parchment">+{depthBuff.hp}%</span> · damage dealt{" "}
            <span className="font-semibold text-red-300">+{depthBuff.dmg}%</span> (HP below is already boosted)
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {standard.map((nl) => (
          <NightlordCard key={nl.id} nl={nl} variant={variant} rows={table?.rows} depthBuff={depthBuff} />
        ))}
      </div>

      {finals.length > 0 && (
        <div className="mt-8">
          <h3 className="eyebrow mb-3 text-gold">Final Bosses · multi-phase</h3>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {finals.map((nl) => (
              <NightlordCard key={nl.id} nl={nl} variant={variant} rows={table?.rows} depthBuff={depthBuff} />
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 font-body text-xs text-parchment-faint">
        Negation: <span className="text-red-300">negative</span> = weakness (takes more damage),{" "}
        <span className="text-sky-300">20+</span> = strong resistance, positive = resists. Status values
        are buildup resistance. {NIGHTLORD_STATS_CREDIT}; weaknesses &amp; expeditions per {NIGHTLORD_CREDIT}.
      </p>
      <p className="mt-2 font-body text-xs text-parchment-faint">
        Events listed are expedition-specific (useful for spotting a hidden run). Blizzard, Night Invaders,
        Scale-Bearing Merchant, Fort Disturbance &amp; Cataclysm can appear on any run. “(?)” = community-reported.
      </p>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded border px-2.5 py-1 font-body text-xs font-semibold transition-colors ${
        active
          ? "border-gold-faint bg-night-700 text-gold-bright"
          : "border-night-600 bg-night-900 text-parchment-muted hover:border-night-500 hover:text-parchment"
      }`}
    >
      {children}
    </button>
  );
}

function NightlordCard({
  nl,
  variant,
  rows,
  depthBuff,
}: {
  nl: Nightlord;
  variant: StatVariant;
  rows?: NightlordStatRow[];
  depthBuff: DepthBuff;
}) {
  const refs = NIGHTLORD_STAT_MAP[nl.id]?.[variant] ?? [];
  const blocks = refs.map((ref) => ({
    label: ref.label,
    row:
      rows?.find((r) => r.name === ref.row) ??
      (variant === "everdark" ? everdarkStatStubs.find((r) => r.name === ref.row) : undefined),
  }));

  return (
    <div className="frame rounded-lg bg-night-800 p-4">
      <div>
        {nl.alias !== nl.name && <p className="eyebrow">{nl.alias}</p>}
        <h3 className="mt-0.5 font-display text-xl font-bold text-parchment">{nl.name}</h3>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 font-body text-[0.65rem] font-semibold uppercase tracking-wide text-parchment-faint">
          Weak to
        </span>
        {nl.weaknesses.map((w) => (
          <WeaknessChip key={w} w={w} />
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {blocks.map((b, i) => (
          <StatBlock key={b.label ?? i} label={b.label} row={b.row} depthBuff={depthBuff} />
        ))}
      </div>

      {/* Which bosses & events show up on this expedition — for identifying a hidden run */}
      <div className="mt-3 space-y-1.5 border-t border-night-700 pt-3">
        <BossLine label="Night 1" items={bossesFor(nl.expedition, "night1")} />
        <BossLine label="Night 2" items={bossesFor(nl.expedition, "night2")} />
        {nl.events && nl.events.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 w-14 shrink-0 font-body text-[0.6rem] font-semibold uppercase tracking-wide text-parchment-faint">
              Events
            </span>
            {nl.events.map((e) => (
              <span key={e} className="rounded border border-gold-faint/50 bg-night-900 px-1.5 py-0.5 font-body text-[0.7rem] text-gold-dim">
                {e}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBlock({
  label,
  row,
  depthBuff,
}: {
  label?: string;
  row?: NightlordStatRow;
  depthBuff: DepthBuff;
}) {
  if (!row) {
    return (
      <div className="rounded-md border border-night-700 bg-night-900/40 p-3">
        {label && <p className="mb-1 font-display text-sm font-semibold text-parchment">{label}</p>}
        <p className="font-body text-xs text-parchment-faint">No stat data.</p>
      </div>
    );
  }

  const hp = row.health !== null ? Math.round(row.health * (1 + (depthBuff?.hp ?? 0) / 100)) : null;

  return (
    <div className="rounded-md border border-night-700 bg-night-900/40 p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        {label && <p className="font-display text-sm font-semibold text-parchment">{label}</p>}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-body text-xs text-parchment-muted">
          <span>
            <span className="text-parchment-faint">HP</span>{" "}
            <span className={`font-semibold tabular-nums ${depthBuff && hp !== null ? "text-gold-bright" : "text-parchment"}`}>
              {hp !== null ? hp.toLocaleString() : "—"}
            </span>
            {depthBuff && row.health !== null && (
              <span className="ml-1 text-parchment-faint">
                (base {row.health.toLocaleString()})
              </span>
            )}
          </span>
          <span>
            <span className="text-parchment-faint">Poise</span>{" "}
            <span className="font-semibold tabular-nums text-parchment">
              {row.poise !== null
                ? row.poise.toLocaleString(undefined, { maximumFractionDigits: 1 })
                : "—"}
            </span>
          </span>
          {depthBuff && (
            <span className="font-semibold text-red-300">Dmg +{depthBuff.dmg}%</span>
          )}
        </div>
      </div>

      <NegationGrid negations={row.negations} />
      <div className="mt-2">
        <StatusChips resistances={row.resistances} />
      </div>
      {row.note && <p className="mt-2 font-body text-xs italic text-parchment-faint">{row.note}</p>}
    </div>
  );
}

/** Bosses of a given category that can appear on an expedition (matches spawnsIn). */
function bossesFor(expedition: string, category: BossCategory) {
  return bosses.filter(
    (b) =>
      b.categories.includes(category) &&
      (b.spawnsIn ?? []).some((s) => s.replace(/\s*\(.*\)$/, "") === expedition),
  );
}

function BossLine({ label, items }: { label: string; items: { id: string; name: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 w-14 shrink-0 font-body text-[0.6rem] font-semibold uppercase tracking-wide text-parchment-faint">
        {label}
      </span>
      {items.map((b) => (
        <Link
          key={b.id}
          href={`/bosses/${b.id}`}
          className="rounded border border-night-600 bg-night-900 px-1.5 py-0.5 font-body text-[0.7rem] text-parchment-muted transition-colors hover:border-gold-faint hover:text-gold"
        >
          {b.name}
        </Link>
      ))}
    </div>
  );
}

function NegationGrid({ negations }: { negations: NightlordStatRow["negations"] }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {STAT_NEGATION_COLUMNS.map((col) => {
        const v = negations[col.key];
        const cls =
          v < 0
            ? "border-red-500/60 text-red-300"
            : v >= 20
              ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
              : v > 0
                ? "border-night-600 text-parchment-faint"
                : "border-night-700 text-parchment-muted";
        return (
          <div key={col.key} className={`rounded border ${cls} px-1.5 py-1 text-center`}>
            <div className="flex items-center justify-center gap-1">
              <StatIcon src={col.icon} alt={col.label} size={12} />
              <span className="font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">
                {col.label}
              </span>
            </div>
            <div className="font-display text-sm font-semibold tabular-nums">
              {v > 0 ? `+${v}` : v}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusChips({ resistances }: { resistances: NightlordStatRow["resistances"] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STAT_STATUS_COLUMNS.map((col) => {
        const value = resistances[col.key];
        const immune = value === "Immune";
        return (
          <span
            key={col.key}
            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-body text-[0.7rem] ${
              immune ? "border-gold-faint text-gold" : "border-night-700 text-parchment-muted"
            }`}
          >
            {col.icon && <StatIcon src={col.icon} alt={col.label} size={14} />}
            {col.label} <span className="font-semibold">{immune ? "—" : value}</span>
          </span>
        );
      })}
    </div>
  );
}

function WeaknessChip({ w }: { w: WeaknessElement }) {
  const c = WEAKNESS[w];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border bg-night-900 px-2 py-0.5 font-body text-xs font-semibold"
      style={{ borderColor: `${c.color}80`, color: c.color }}
    >
      {c.icon && (
        <Image src={asset(c.icon)} alt={c.label} width={16} height={16} className="h-4 w-4 rounded object-contain" />
      )}
      {c.label}
    </span>
  );
}
