import type { Merchant, ShopWeapon } from "@/lib/types";
import { SHOP_RARITY, weaponForm } from "@/lib/types";
import { iconFor } from "@/data/weaponIcons";
import { weaponSkills } from "@/data/weaponSkills";
import { withPassiveValue } from "@/lib/passiveBoost";
import { AFFINITY_ICON } from "@/lib/weapons";
import { STATUS_ICON } from "@/lib/nightlords";
import { WeaponIcon } from "./WeaponIcon";
import { StatIcon } from "./StatIcon";

// Affinity field token (e.g. "Fire/Bleed") → element or status icon. Tokens with
// no icon (Physical) fall through to text.
const AFF_ICON: Record<string, { src: string; label: string }> = {
  magic: { src: AFFINITY_ICON.magic, label: "Magic" },
  fire: { src: AFFINITY_ICON.fire, label: "Fire" },
  lightning: { src: AFFINITY_ICON.lightning, label: "Lightning" },
  holy: { src: AFFINITY_ICON.holy, label: "Holy" },
  bleed: { src: STATUS_ICON.bleed, label: "Bleed" },
  poison: { src: STATUS_ICON.poison, label: "Poison" },
  rot: { src: STATUS_ICON.rot, label: "Rot" },
  frost: { src: STATUS_ICON.frost, label: "Frost" },
  frostbite: { src: STATUS_ICON.frost, label: "Frostbite" },
  sleep: { src: STATUS_ICON.sleep, label: "Sleep" },
  madness: { src: STATUS_ICON.madness, label: "Madness" },
  frenzy: { src: STATUS_ICON.madness, label: "Frenzy" },
};

/** Affinity / status as icons (Physical and any unmapped token stay as text). */
function Affinity({ affinity }: { affinity: string }) {
  const parts = affinity.split("/").map((t) => t.trim()).filter(Boolean);
  return (
    <span className="inline-flex items-center gap-1">
      {parts.map((t, i) => {
        const m = AFF_ICON[t.toLowerCase()];
        return m ? (
          <span key={i} title={m.label} className="inline-flex">
            <StatIcon src={m.src} alt={m.label} />
          </span>
        ) : (
          <span key={i}>{t}</span>
        );
      })}
    </span>
  );
}

// Skill name → effect, for the skill tooltip (strips parenthetical suffixes).
const normSkill = (s: string) =>
  s.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const SKILL_EFFECT: Record<string, string> = {};
for (const sk of weaponSkills) {
  const k = normSkill(sk.name);
  if (k && !(k in SKILL_EFFECT)) SKILL_EFFECT[k] = sk.effect;
}

/** A merchant's stock for one set: its weapons plus crystal tears & aromatics. */
export function MerchantSection({
  title,
  merchant,
  deepOfNight = false,
}: {
  title: string;
  merchant: Merchant;
  deepOfNight?: boolean;
}) {
  return (
    <section>
      <h3 className="eyebrow mb-3">{title}</h3>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {/* Deep-of-Night-only items are hidden in the normal shop. */}
        {merchant.weapons
          .filter((w) => deepOfNight || !w.deepOnly)
          .map((w, i) => (
            <WeaponRow key={`${w.name}-${i}`} w={w} deepOfNight={deepOfNight} />
          ))}
      </ul>

      {(merchant.tears.length > 0 || merchant.aromatics.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 rounded-md border border-night-700 bg-night-850/60 px-4 py-2.5 font-body text-sm">
          {merchant.tears.length > 0 && (
            <p className="text-parchment-muted">
              <span className="text-parchment-faint">Crystal Tears: </span>
              {merchant.tears.join(" · ")}
            </p>
          )}
          {merchant.aromatics.length > 0 && (
            <p className="text-parchment-muted">
              <span className="text-parchment-faint">Aromatics: </span>
              {merchant.aromatics.join(" · ")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function WeaponRow({ w, deepOfNight }: { w: ShopWeapon; deepOfNight: boolean }) {
  const f = weaponForm(w, deepOfNight);
  const meta = SHOP_RARITY[f.rarity];
  const eff = f.skill ? SKILL_EFFECT[normSkill(f.skill)] : undefined;
  const hasSkill = Boolean(f.skill) && f.skill.toLowerCase() !== "no skill";

  return (
    <li
      className="frame flex gap-3 rounded-md border-l-[3px] px-3 py-2.5"
      style={{ borderLeftColor: meta.color, background: `${meta.color}12` }}
    >
      <WeaponIcon src={iconFor({ name: f.name })} alt={f.name} size={48} frame={meta.frame} ring={meta.color} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-base font-semibold leading-tight" style={{ color: meta.color }}>
            {f.name}
          </span>
          {f.price > 0 && (
            <span className="shrink-0 font-body text-xs tabular-nums text-parchment-faint">
              {f.price.toLocaleString()}
            </span>
          )}
        </div>
        {(f.affinity || hasSkill) && (
          <p className="mt-0.5 flex flex-wrap gap-x-2 font-body text-xs text-parchment-faint">
            {f.affinity && <Affinity affinity={f.affinity} />}
            {f.affinity && hasSkill && <span aria-hidden>·</span>}
            {hasSkill && (
              <span className={eff ? "cursor-help text-parchment-muted underline decoration-dotted decoration-night-500 underline-offset-2" : "text-parchment-muted"} title={eff}>
                {f.skill}
              </span>
            )}
          </p>
        )}
        {f.passives.map((p, i) => (
          <p key={i} className="mt-1 font-body text-sm leading-snug text-parchment-muted">{withPassiveValue(p, f.rarity)}</p>
        ))}
        {f.curse && <p className="mt-1 font-body text-sm leading-snug text-red-300">{f.curse}</p>}
      </div>
    </li>
  );
}
