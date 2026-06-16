import Image from "next/image";
import { nightlords, NIGHTLORD_CREDIT } from "@/data/nightlords";
import {
  NEGATION_COLUMNS,
  STATUS_COLUMNS,
  WEAKNESS,
  type Nightlord,
  type Resist,
  type WeaknessElement,
} from "@/lib/nightlords";
import { asset } from "@/lib/assets";

/** The 8 Nightlords with weaknesses, damage negations, resistances, and HP. */
export function Nightlords() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {nightlords.map((nl) => (
          <NightlordCard key={nl.id} nl={nl} />
        ))}
      </div>
      <p className="mt-6 font-body text-xs text-parchment-faint">
        Negation: negative = weakness (takes more damage), positive = resists. HP is the solo value;
        it scales with team size. {NIGHTLORD_CREDIT}.
      </p>
    </div>
  );
}

function NightlordCard({ nl }: { nl: Nightlord }) {
  return (
    <div className="frame rounded-lg bg-night-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{nl.alias}</p>
          <h3 className="mt-0.5 font-display text-xl font-bold text-parchment">{nl.name}</h3>
        </div>
        <div className="shrink-0 text-right font-body text-xs text-parchment-muted">
          <div>
            <span className="text-parchment-faint">HP</span> {nl.hpNormal.toLocaleString()}
          </div>
          {nl.hpEverdark && (
            <div className="text-red-300">Everdark {nl.hpEverdark.toLocaleString()}</div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 font-body text-[0.65rem] font-semibold uppercase tracking-wide text-parchment-faint">
          Weak to
        </span>
        {nl.weaknesses.map((w) => (
          <WeaknessChip key={w} w={w} />
        ))}
      </div>

      {/* Damage negations */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {NEGATION_COLUMNS.map((col) => {
          const v = nl.negations[col.key];
          const cls =
            v < 0 ? "border-red-500/60 text-red-300" : v > 0 ? "border-night-600 text-parchment-faint" : "border-night-700 text-parchment-muted";
          return (
            <div key={col.key} className={`rounded border ${cls} px-1.5 py-1 text-center`}>
              <div className="font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">
                {col.label}
              </div>
              <div className="font-display text-sm font-semibold tabular-nums">
                {v > 0 ? `+${v}` : v}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status resistances */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {STATUS_COLUMNS.map((col) => (
          <ResistChip key={col.key} label={col.label} value={nl.resistances[col.key]} />
        ))}
      </div>

      <p className="mt-2 font-body text-sm text-parchment-muted">{nl.note}</p>
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
