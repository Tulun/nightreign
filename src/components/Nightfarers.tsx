import { nightfarers } from "@/data/characters";
import {
  ATTRIBUTE_COLUMNS,
  CHARACTER_CREDIT,
  NEGATION_COLUMNS,
  RESIST_COLUMNS,
  type Nightfarer,
} from "@/lib/characters";
import { NEG_ICONS } from "@/lib/negationCalc";
import { StatIcon } from "@/components/StatIcon";

/** Base-stat cards for the 10 Nightfarers. */
export function Nightfarers() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {nightfarers.map((c) => (
          <NightfarerCard key={c.name} c={c} />
        ))}
      </div>
      <p className="mt-6 font-body text-xs text-parchment-faint">
        Negations are % damage reduced; resistances are buildup needed to trigger the effect (higher = harder).{" "}
        {CHARACTER_CREDIT}.
      </p>
    </div>
  );
}

function NightfarerCard({ c }: { c: Nightfarer }) {
  return (
    <div className="frame rounded-lg bg-night-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-bold text-parchment">{c.name}</h3>
        <div className="flex shrink-0 gap-3 font-body text-xs">
          <Vital label="HP" value={c.hp} />
          <Vital label="FP" value={c.fp} />
          <Vital label="Stam" value={c.stamina} />
          <Vital label="Poise" value={c.poise} />
        </div>
      </div>

      {/* Attributes */}
      <div className="mt-3 grid grid-cols-8 gap-1">
        {ATTRIBUTE_COLUMNS.map((a) => (
          <div key={a.key} className="rounded border border-night-700 bg-night-900/50 px-1 py-1 text-center">
            <div className="font-body text-[0.55rem] uppercase tracking-wide text-parchment-faint">{a.label}</div>
            <div className="font-display text-sm font-semibold tabular-nums text-parchment">{c.attributes[a.key]}</div>
          </div>
        ))}
      </div>

      {/* Negations */}
      <div className="mt-3">
        <p className="eyebrow mb-1.5">Damage Negation</p>
        <div className="grid grid-cols-8 gap-1">
          {NEGATION_COLUMNS.map((n) => {
            const v = c.negations[n.key];
            const cls = v >= 24 ? "border-sky-500/60 bg-sky-500/10 text-sky-300" : v <= 12 ? "border-red-500/40 text-red-300" : "border-night-700 text-parchment-muted";
            return (
              <div key={n.key} className={`rounded border ${cls} px-1 py-1 text-center`}>
                <div className="flex items-center justify-center gap-0.5 font-body text-[0.55rem] uppercase tracking-wide text-parchment-faint">
                  {NEG_ICONS[n.key] && <StatIcon src={NEG_ICONS[n.key]!} alt="" size={12} />}{n.label}
                </div>
                <div className="font-display text-xs font-semibold tabular-nums">{v}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resistances */}
      <div className="mt-3">
        <p className="eyebrow mb-1.5">Status Resistance</p>
        <div className="flex flex-wrap gap-1.5">
          {RESIST_COLUMNS.map((r) => (
            <span key={r.key} className="rounded border border-night-700 px-1.5 py-0.5 font-body text-[0.7rem] text-parchment-muted">
              {r.label} <span className="font-semibold text-parchment">{c.resistances[r.key]}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Vital({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <div className="text-[0.55rem] uppercase tracking-wide text-parchment-faint">{label}</div>
      <div className="font-display text-base font-semibold tabular-nums text-gold-dim">{value}</div>
    </div>
  );
}
