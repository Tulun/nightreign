import { BOSS_CREDIT, DAMAGE_LABEL, type Boss, type NegationKey, type Resist } from "@/lib/bosses";
import { ELEMENT_ICON, NEGATION_COLUMNS, STATUS_COLUMNS, STATUS_ICON } from "@/lib/nightlords";
import { StatIcon } from "@/components/StatIcon";

/** Full combat-info page body for a single boss. Used by /bosses/[id]. */
export function BossDetailView({ boss }: { boss: Boss }) {
  const role = boss.spawnsIn ? "Appears in expeditions" : "Locations";
  const places = boss.spawnsIn ?? boss.locations ?? [];

  return (
    <div className="space-y-6">
      {boss.quote && (
        <p className="max-w-prose border-l-2 border-night-600 pl-4 font-body text-base italic text-parchment-faint">
          “{boss.quote}”
        </p>
      )}

      {places.length > 0 && (
        <div>
          <p className="eyebrow mb-2">{role}</p>
          <div className="flex flex-wrap gap-1.5">
            {places.map((s) => (
              <span key={s} className="rounded border border-night-600 bg-night-800 px-2.5 py-1 font-body text-sm text-parchment">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Combat summary */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 font-body text-sm text-parchment-muted">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Negations */}
        <div>
          <p className="eyebrow mb-2">Negations / Absorptions</p>
          <div className="grid grid-cols-4 gap-1.5">
            {NEGATION_COLUMNS.map((col) => {
              const v = boss.negations[col.key];
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
                <div key={col.key} className={`rounded border ${cls} px-1.5 py-1.5 text-center`}>
                  <div className="flex items-center justify-center gap-1">
                    {icon && <StatIcon src={icon} alt={col.label} size={12} />}
                    <span className="font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">{col.label}</span>
                  </div>
                  <div className="font-display text-base font-semibold tabular-nums">{v > 0 ? `+${v}` : v}</div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 font-body text-xs text-parchment-faint">
            % of damage blocked. Negative = takes extra damage (weakness); 20+ = strong resist.
          </p>
        </div>

        {/* Resistances */}
        <div>
          <p className="eyebrow mb-2">Status Resistances</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_COLUMNS.map((col) => (
              <ResistChip key={col.key} label={col.label} icon={STATUS_ICON[col.key]} value={boss.resistances[col.key]} />
            ))}
          </div>
          <p className="mt-2 font-body text-xs text-parchment-faint">
            Buildup needed to trigger the effect. Higher = harder to proc; “Imm” = immune.
          </p>
        </div>
      </div>

      {/* Weak / Strong summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="eyebrow mb-2 text-red-300">Weak to</p>
          <div className="flex flex-wrap gap-1.5">
            {boss.weakTo.length > 0 ? (
              boss.weakTo.map((w) => <DamageChip key={w} kind={w} tone="weak" />)
            ) : (
              <span className="font-body text-sm text-parchment-faint">No damage-type weakness</span>
            )}
          </div>
        </div>
        <div>
          <p className="eyebrow mb-2 text-sky-300">Stronger vs</p>
          <div className="flex flex-wrap gap-1.5">
            {boss.strongerVs.length > 0 ? (
              boss.strongerVs.map((w) => <DamageChip key={w} kind={w} tone="strong" />)
            ) : (
              <span className="font-body text-sm text-parchment-faint">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Drops */}
      {boss.drops && boss.drops.length > 0 && (
        <div>
          <p className="eyebrow mb-2">Rune Drops</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {boss.drops.map((d) => (
              <div key={d.source} className="rounded-md border border-night-700 bg-night-800/60 px-3 py-2 font-body text-sm text-parchment-muted">
                <span className="font-semibold text-parchment">{d.source}</span>
                {d.reward && <span className="text-gold-dim"> · {d.reward}</span>}
                <div className="mt-1 flex flex-wrap gap-x-4 text-parchment-faint">
                  {typeof d.solo === "number" && <span>Solo {d.solo.toLocaleString()}</span>}
                  {typeof d.duo === "number" && <span>Duo {d.duo.toLocaleString()}</span>}
                  {typeof d.trio === "number" && <span>Trio {d.trio.toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {boss.note && <p className="max-w-prose font-body text-sm text-parchment-muted">{boss.note}</p>}

      <p className="font-body text-xs text-parchment-faint">{BOSS_CREDIT}.</p>
    </div>
  );
}

function DamageChip({ kind, tone }: { kind: NegationKey; tone: "weak" | "strong" }) {
  const icon = ELEMENT_ICON[kind];
  const cls = tone === "weak" ? "border-red-500/50 text-red-300" : "border-sky-500/40 text-sky-300";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-body text-sm ${cls}`}>
      {icon && <StatIcon src={icon} alt={DAMAGE_LABEL[kind]} />}
      {DAMAGE_LABEL[kind]}
    </span>
  );
}

function ResistChip({ label, icon, value }: { label: string; icon?: string; value: Resist }) {
  const inner = (
    <>
      {icon && <StatIcon src={icon} alt={label} />}
      {label}
    </>
  );
  if (value === null)
    return (
      <span className="inline-flex items-center gap-1 rounded border border-night-700 px-2 py-1 font-body text-xs text-parchment-faint">
        {inner} —
      </span>
    );
  const immune = value === "Immune";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-body text-xs ${
        immune ? "border-gold-faint text-gold" : "border-night-700 text-parchment-muted"
      }`}
    >
      {inner} <span className="font-semibold">{immune ? "Imm" : value}</span>
    </span>
  );
}
