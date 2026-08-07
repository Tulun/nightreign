"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Dropdown } from "./Dropdown";
import {
  reviveBars,
  baseReviveValues,
  standardMovesets,
  powerstanceMovesets,
  reviveSpells,
  characterSkillRevives,
  REVIVE_CREDIT,
  REVIVE_SOURCE_URL,
} from "@/data/revive";

/** Revive damage per attack: near-death gauge, weapon movesets, spells, and skills. */
export function ReviveReference() {
  return (
    <div className="space-y-10">
      <GaugeSection />
      <HowItWorks />
      <BaseValues />
      <SpellsSection />
      <MeleeSection />
      <SkillsSection />
      <PracticalNotes />

      <p className="font-body text-sm text-parchment-faint">
        {REVIVE_CREDIT}{" "}
        <a
          href={REVIVE_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-gold"
        >
          Source spreadsheet
        </a>
      </p>
    </div>
  );
}

function GaugeSection() {
  return (
    <section>
      <h3 className="eyebrow mb-3 text-gold-bright">The near-death gauge</h3>
      <p className="mb-4 max-w-prose font-body text-base text-parchment-muted">
        Each time a Nightfarer falls in the same night, their revive gauge gains
        a bar and gets tougher: more total HP to chew through,{" "}
        <span className="font-semibold text-parchment">and it refills faster</span>{" "}
        while nobody is working on it. Hitting a downed teammate deals revive
        damage; when the gauge hits zero, they stand up.
      </p>
      <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        {reviveBars.map((b) => (
          <div key={b.bars} className="frame rounded-lg bg-night-800 p-4 text-center">
            <p className="font-body text-base text-parchment-faint">
              {b.bars} bar{b.bars > 1 ? "s" : ""} ({ordinal(b.timesFelled)} fall)
            </p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-parchment">
              {b.totalHp} HP
            </p>
            <p className="mt-1 font-body text-base text-parchment-faint">
              refills {b.refillPerSecond} HP/s
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section>
      <h3 className="eyebrow mb-3 text-gold-bright">How revive damage is calculated</h3>
      <ul className="max-w-prose list-disc space-y-2 pl-5 font-body text-base text-parchment-muted">
        <li>
          Every weapon class has a hidden{" "}
          <span className="font-semibold text-parchment">base revive value</span> (below).
          Each attack in the moveset multiplies it by its own modifier — e.g. a
          katana R1 is 100% of 14, a charged R2 around 160%. Actual damage dealt
          is irrelevant.
        </li>
        <li>
          Revive damage is per <span className="font-semibold text-parchment">hit</span>,
          so fast multi-hit attacks and multi-projectile spells add up quickly.
        </li>
        <li>
          Reviving generates aggro — +200 on the first tick, refreshed every 2
          seconds while you keep at it. See{" "}
          <Link href="/aggro" className="underline decoration-dotted underline-offset-2 hover:text-gold">
            Aggro &amp; Targeting
          </Link>
          .
        </li>
      </ul>
    </section>
  );
}

function BaseValues() {
  return (
    <section>
      <h3 className="eyebrow mb-3 text-gold-bright">Base revive value by weapon class</h3>
      <div className="frame overflow-x-auto rounded-lg">
        <table className="w-full border-collapse text-left font-body text-base">
          <thead>
            <tr className="text-parchment-faint">
              <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 font-semibold">Base</th>
              <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 font-semibold">Weapon classes</th>
            </tr>
          </thead>
          <tbody>
            {baseReviveValues.map((g) => (
              <tr key={g.base} className="border-b border-night-800/70 hover:bg-night-800/60">
                <td className="px-3 py-2.5 font-display text-lg font-bold tabular-nums text-parchment">
                  {g.base}
                </td>
                <td className="px-3 py-2.5 text-parchment-muted">{g.classes.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SpellsSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "sorcery" | "incantation">("all");

  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      reviveSpells.filter((s) => {
        if (category !== "all" && s.category !== category) return false;
        return !q || s.name.toLowerCase().includes(q);
      }),
    [q, category],
  );

  return (
    <section>
      <h3 className="eyebrow mb-3 text-gold-bright">Spells &amp; incantations</h3>
      <p className="mb-4 max-w-prose font-body text-base text-parchment-muted">
        Revive per full cast, assuming every projectile lands. The cast counts
        assume back-to-back casting — leave gaps and the gauge refills under
        you, especially at three bars.
      </p>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search spells…"
          className="w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-body text-base text-parchment placeholder:text-parchment-faint focus:border-gold-faint focus:outline-none sm:max-w-sm"
        />
        <div className="flex gap-1.5">
          {(
            [
              ["all", "All"],
              ["sorcery", "Sorceries"],
              ["incantation", "Incantations"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`rounded-full border px-3 py-1 font-body text-sm transition-colors ${
                category === key
                  ? "border-gold-faint bg-night-800 text-gold-bright"
                  : "border-night-600 text-parchment-faint hover:text-parchment"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="frame overflow-x-auto rounded-lg">
        <table className="w-full border-collapse text-left font-body text-base">
          <thead>
            <tr className="text-parchment-faint">
              <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 font-semibold">Spell</th>
              <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 text-right font-semibold">Hits</th>
              <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 text-right font-semibold">Revive / cast</th>
              <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 text-right font-semibold">
                Casts for 1 / 2 / 3 bars
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((s, i) => (
              <tr key={`${s.name}-${s.variant ?? ""}-${i}`} className="border-b border-night-800/70 hover:bg-night-800/60">
                <td className="px-3 py-2.5">
                  <span className="font-display font-semibold text-parchment">{s.name}</span>
                  {s.variant && (
                    <span className="ml-2 rounded border border-night-600 px-1.5 py-0.5 font-body text-sm text-parchment-faint">
                      {s.variant}
                    </span>
                  )}
                  {s.notes && (
                    <span className="block font-body text-sm text-parchment-faint">{s.notes}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-parchment-muted">{s.hits ?? "—"}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${reviveTone(s.total)}`}>
                  {s.total ?? "varies"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-parchment-muted">{castsLabel(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-body text-sm text-parchment-faint">
        Values ≥ 40 (gold) revive a first fall in one cast; ≥ 90 (red) clear a
        second fall outright.
      </p>
    </section>
  );
}

function MeleeSection() {
  const [weapon, setWeapon] = useState(standardMovesets[0].weapon);
  const standard = standardMovesets.find((w) => w.weapon === weapon);
  const powerstance = powerstanceMovesets.find((w) => w.weapon === weapon);

  return (
    <section>
      <h3 className="eyebrow mb-3 text-gold-bright">Melee movesets</h3>
      <p className="mb-4 max-w-prose font-body text-base text-parchment-muted">
        Full per-attack revive values. Multi-hit attacks are totals across every
        hit. Character-specific movesets (Wylder, Raider, Duchess, …) are
        listed separately where they differ.
      </p>
      <Dropdown
        value={weapon}
        onChange={(v) => v && setWeapon(v)}
        clearable={false}
        searchable
        options={standardMovesets.map((w) => ({ value: w.weapon, label: w.weapon }))}
        className="mb-4 max-w-xs"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {standard && (
          <MoveTable
            title={`Standard (base ${standard.base ?? "—"})`}
            head={["Attack", "Hits", "1H", "2H"]}
            rows={standard.attacks.map((a) => [
              a.name,
              String(a.hits),
              a.oneHand,
              a.twoHand,
            ])}
          />
        )}
        {powerstance && (
          <MoveTable
            title="Powerstance (both weapons, all hits)"
            head={["Attack", "Hits", "Total"]}
            rows={powerstance.attacks.map((a) => [a.name, String(a.hits), a.total])}
          />
        )}
      </div>
    </section>
  );
}

function MoveTable({
  title,
  head,
  rows,
}: {
  title: string;
  head: string[];
  rows: (string | number | null)[][];
}) {
  return (
    <div>
      <p className="mb-2 font-display text-base font-semibold text-parchment">{title}</p>
      <div className="frame overflow-x-auto rounded-lg">
        <table className="w-full border-collapse text-left font-body text-base">
          <thead>
            <tr className="text-parchment-faint">
              {head.map((h, i) => (
                <th
                  key={h}
                  className={`border-b border-night-600 bg-night-850 px-3 py-2 font-semibold ${i > 0 ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-b border-night-800/70 hover:bg-night-800/60">
                {r.map((c, ci) => (
                  <td
                    key={ci}
                    className={
                      ci === 0
                        ? "px-3 py-2 text-parchment"
                        : `px-3 py-2 text-right tabular-nums ${
                            typeof c === "number" ? `font-semibold ${reviveTone(c)}` : "text-parchment-faint"
                          }`
                    }
                  >
                    {c ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SkillsSection() {
  return (
    <section>
      <h3 className="eyebrow mb-3 text-gold-bright">Character skills &amp; ultimates</h3>
      <div className="frame max-w-2xl overflow-x-auto rounded-lg">
        <table className="w-full border-collapse text-left font-body text-base">
          <thead>
            <tr className="text-parchment-faint">
              <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 font-semibold">Nightfarer</th>
              <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 font-semibold">Skill</th>
              <th className="border-b border-night-600 bg-night-850 px-3 py-2.5 text-right font-semibold">Revive</th>
            </tr>
          </thead>
          <tbody>
            {characterSkillRevives.map((s, i) => (
              <tr key={i} className="border-b border-night-800/70 hover:bg-night-800/60">
                <td className="px-3 py-2 text-parchment-muted">
                  {i === 0 || characterSkillRevives[i - 1].character !== s.character
                    ? s.character
                    : ""}
                </td>
                <td className={`px-3 py-2 ${s.sub ? "pl-7 text-parchment-muted" : "font-display font-semibold text-parchment"}`}>
                  {s.skill}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums font-semibold ${reviveTone(s.total)}`}>
                  {s.total ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-2xl font-body text-sm text-parchment-faint">
        Non-damaging skills are omitted. Revenant&rsquo;s Immortal March revives
        teammates directly rather than through revive damage; Guardian&rsquo;s
        Wings of Salvation (1399) is effectively an instant revive on landing.
      </p>
    </section>
  );
}

function PracticalNotes() {
  return (
    <section>
      <h3 className="eyebrow mb-3 text-gold-bright">In practice</h3>
      <ul className="max-w-prose list-disc space-y-2 pl-5 font-body text-base text-parchment-muted">
        <li>
          <span className="font-semibold text-parchment">Cannon of Haima</span> is the
          revive king: 130 per uncharged cast clears a second fall in one hit
          and a third fall in two — no charging needed.
        </li>
        <li>
          <span className="font-semibold text-parchment">Comet</span> (37/39) is the
          safest way to chip out a three-bar revive at range: seven casts, and
          being single-projectile it can&rsquo;t be body-blocked piecemeal.{" "}
          <span className="font-semibold text-parchment">Stars of Ruin</span> (48) is a
          one-cast first-fall revive, but with aggro on you the boss eats
          projectiles and the math falls apart.
        </li>
        <li>
          Delayed casts — <span className="font-semibold text-parchment">Magic Glintblade</span>,{" "}
          <span className="font-semibold text-parchment">Glintblade Phalanx</span>,{" "}
          <span className="font-semibold text-parchment">Flame of the Fell God</span> — deal
          their revive damage after you&rsquo;ve moved on, so the aggro from
          reviving lands late or not at all.
        </li>
        <li>
          Melee one-hit first-fall revives (≥ 40): any powerstanced colossal
          weapon attack, charged R2s of colossal weapons and Raider&rsquo;s
          moveset (one- or two-handed), two-handed charged R2s of twinblades,
          halberds and Revenant&rsquo;s claws, and powerstanced running attacks
          of most great weapon classes — check the moveset tables above.
        </li>
        <li>
          At three bars the gauge refills{" "}
          <span className="font-semibold text-parchment">40 HP per second</span> — slow
          drip damage barely outruns it. Commit burst, or don&rsquo;t start.
        </li>
      </ul>
    </section>
  );
}

/** Color-code revive amounts: ≥40 stands up a first fall in one hit, ≥90 a second. */
function reviveTone(total: number | null) {
  if (total == null) return "text-parchment-faint";
  if (total >= 90) return "text-red-300";
  if (total >= 40) return "text-gold-bright";
  return "text-parchment-muted";
}

function castsLabel(total: number | null) {
  if (!total) return "—";
  return [40, 90, 240].map((hp) => Math.ceil(hp / total)).join(" / ");
}

function ordinal(n: number) {
  return n === 1 ? "1st" : n === 2 ? "2nd" : "3rd";
}
