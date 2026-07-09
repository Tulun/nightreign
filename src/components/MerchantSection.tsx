import Image from "next/image";
import type { Merchant, ShopWeapon } from "@/lib/types";
import { SHOP_RARITY, weaponForm } from "@/lib/types";
import { iconFor } from "@/data/weaponIcons";
import { weaponSkills } from "@/data/weaponSkills";
import { bagcraftItems } from "@/data/bagcraft";
import type { BagcraftItem } from "@/lib/bagcraft";
import { withPassiveValue } from "@/lib/passiveBoost";
import { AFFINITY_ICON } from "@/lib/weapons";
import { STATUS_ICON } from "@/lib/nightlords";
import { asset } from "@/lib/assets";
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

// Tear/aromatic name → bagcraft item, tolerating the shop data's casing and
// plural variants ("ironjar Aromatic", "Spark Aromatics", "Thorny Cracked tear").
const normConsumable = (s: string) => {
  const k = s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  return k.endsWith("s") ? k.slice(0, -1) : k;
};
const CONSUMABLES: Record<string, BagcraftItem> = {};
for (const it of bagcraftItems) {
  if (it.category === "Tear" || it.category === "Aromatic") CONSUMABLES[normConsumable(it.name)] = it;
}

/** A crystal tear or aromatic with its icon and full effect description. */
function ConsumableRow({ name, kind }: { name: string; kind: "Crystal Tear" | "Aromatic" }) {
  const item = CONSUMABLES[normConsumable(name)];
  if (!item) {
    return (
      <li className="flex items-center gap-3 rounded-md border border-night-700 bg-night-850/60 px-3 py-2">
        <span className="font-body text-sm text-parchment-muted">{name}</span>
      </li>
    );
  }
  return (
    <li
      className="flex gap-3 rounded-md border border-night-700 bg-night-850/60 px-3 py-2"
      title={`Scholar's Bagcraft — L2: ${item.l2} · L3: ${item.l3}`}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-night-600 bg-night-900">
        {item.icon && (
          <Image
            src={asset(item.icon)}
            alt={item.name}
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-sm font-semibold leading-tight text-parchment">
            {item.name}
          </span>
          <span className="shrink-0 font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">
            {kind}
          </span>
        </div>
        <p className="mt-0.5 font-body text-xs leading-snug text-parchment-muted">{item.l1}</p>
      </div>
    </li>
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
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {merchant.tears.map((t, i) => (
            <ConsumableRow key={`tear-${t}-${i}`} name={t} kind="Crystal Tear" />
          ))}
          {merchant.aromatics.map((a, i) => (
            <ConsumableRow key={`aroma-${a}-${i}`} name={a} kind="Aromatic" />
          ))}
        </ul>
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
