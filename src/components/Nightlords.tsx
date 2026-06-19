import Image from "next/image";
import Link from "next/link";
import { nightlords, NIGHTLORD_CREDIT } from "@/data/nightlords";
import { bosses } from "@/data/bosses";
import type { BossCategory } from "@/lib/bosses";
import {
  ELEMENT_ICON,
  NEGATION_COLUMNS,
  STATUS_COLUMNS,
  STATUS_ICON,
  WEAKNESS,
  type NegationKey,
  type Nightlord,
  type NightlordPhase,
  type Resist,
  type StatusKey,
  type WeaknessElement,
} from "@/lib/nightlords";
import { asset } from "@/lib/assets";
import { StatIcon } from "@/components/StatIcon";

/** The Nightlords with weaknesses, damage negations, resistances, and HP. */
export function Nightlords() {
  const standard = nightlords.filter((nl) => !nl.phases);
  const finals = nightlords.filter((nl) => nl.phases);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {standard.map((nl) => (
          <NightlordCard key={nl.id} nl={nl} />
        ))}
      </div>

      {finals.length > 0 && (
        <div className="mt-8">
          <h3 className="eyebrow mb-3 text-gold">Final Bosses · multi-phase</h3>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {finals.map((nl) => (
              <NightlordCard key={nl.id} nl={nl} />
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 font-body text-xs text-parchment-faint">
        Negation: <span className="text-red-300">negative</span> = weakness (takes more damage),{" "}
        <span className="text-sky-300">20+</span> = strong resistance, positive = resists. HP is the
        solo value; it scales with team size. {NIGHTLORD_CREDIT}.
      </p>
      <p className="mt-2 font-body text-xs text-parchment-faint">
        Events listed are expedition-specific (useful for spotting a hidden run). Blizzard, Night Invaders,
        Scale-Bearing Merchant, Fort Disturbance &amp; Cataclysm can appear on any run. “(?)” = community-reported.
      </p>
    </div>
  );
}

function NightlordCard({ nl }: { nl: Nightlord }) {
  return (
    <div className="frame rounded-lg bg-night-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          {nl.alias !== nl.name && <p className="eyebrow">{nl.alias}</p>}
          <h3 className="mt-0.5 font-display text-xl font-bold text-parchment">{nl.name}</h3>
        </div>
        {!nl.phases && (
          <div className="shrink-0 text-right font-body text-xs text-parchment-muted">
            <div>
              <span className="text-parchment-faint">HP</span>{" "}
              {nl.hpNormal !== null ? nl.hpNormal.toLocaleString() : "—"}
            </div>
            {nl.hpEverdark && (
              <div className="text-red-300">Everdark {nl.hpEverdark.toLocaleString()}</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 font-body text-[0.65rem] font-semibold uppercase tracking-wide text-parchment-faint">
          Weak to
        </span>
        {nl.weaknesses.map((w) => (
          <WeaknessChip key={w} w={w} />
        ))}
      </div>

      {nl.phases ? (
        <div className="mt-3 space-y-3">
          {nl.phases.map((phase) => (
            <PhaseBlock key={phase.label} phase={phase} />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-3">
            <NegationGrid negations={nl.negations} />
          </div>
          <div className="mt-2">
            <StatusChips resistances={nl.resistances} />
          </div>
        </>
      )}

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

function PhaseBlock({ phase }: { phase: NightlordPhase }) {
  return (
    <div className="rounded-md border border-night-700 bg-night-900/40 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="font-display text-sm font-semibold text-parchment">{phase.label}</p>
        {phase.hp !== null && (
          <span className="font-body text-xs text-parchment-muted">
            <span className="text-parchment-faint">HP</span> {phase.hp.toLocaleString()}
          </span>
        )}
      </div>
      <NegationGrid negations={phase.negations} />
      <div className="mt-2">
        <StatusChips resistances={phase.resistances} />
      </div>
      {phase.note && (
        <p className="mt-2 font-body text-xs text-parchment-faint">{phase.note}</p>
      )}
    </div>
  );
}

function NegationGrid({ negations }: { negations: Record<NegationKey, number> }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {NEGATION_COLUMNS.map((col) => {
        const v = negations[col.key];
        const cls =
          v < 0
            ? "border-red-500/60 text-red-300"
            : v >= 20
              ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
              : v > 0
                ? "border-night-600 text-parchment-faint"
                : "border-night-700 text-parchment-muted";
        const icon = ELEMENT_ICON[col.key];
        return (
          <div key={col.key} className={`rounded border ${cls} px-1.5 py-1 text-center`}>
            <div className="flex items-center justify-center gap-1">
              {icon && <StatIcon src={icon} alt={col.label} size={12} />}
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

function StatusChips({ resistances }: { resistances: Record<StatusKey, Resist> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUS_COLUMNS.map((col) => (
        <ResistChip key={col.key} label={col.label} icon={STATUS_ICON[col.key]} value={resistances[col.key]} />
      ))}
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

function ResistChip({ label, icon, value }: { label: string; icon?: string; value: Resist }) {
  if (value === null) return null;
  const immune = value === "Immune";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-body text-[0.7rem] ${
        immune ? "border-gold-faint text-gold" : "border-night-700 text-parchment-muted"
      }`}
    >
      {icon && <StatIcon src={icon} alt={label} size={14} />}
      {label} <span className="font-semibold">{immune ? "—" : value}</span>
    </span>
  );
}
