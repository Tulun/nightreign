"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { weapons } from "@/data/weapons";
import { weaponSkills } from "@/data/weaponSkills";
import { Dropdown } from "@/components/Dropdown";
import { MultiSelect } from "@/components/MultiSelect";
import { WeaponIcon } from "@/components/WeaponIcon";
import { RecipeAffinityIcon } from "@/components/RecipeAffinityIcon";
import { iconFor } from "@/data/weaponIcons";
import { asset } from "@/lib/assets";
import { splitIcon, type Element } from "@/lib/cocktails";
import { STATUS_ICON, type StatusKey } from "@/lib/nightlords";
import {
  AP_COLUMNS,
  AFFINITY_ICON,
  DAMAGE_TYPE_ICON,
  DAMAGE_TYPE_LABEL,
  damageTypesFor,
  RARITY_META,
  RARITY_FRAMES,
  SCALING_STATS,
  WEAPON_CREDIT,
  type Weapon,
} from "@/lib/weapons";

/** Weapon-class order = first-seen order in the data. */
const TYPE_ORDER = Array.from(new Set(weapons.map((w) => w.type)));

// Skill name → effect, for the Skill column tooltip. Strips parenthetical
// suffixes ("(Skill)", "(1)") so a weapon's skill matches the skill entry.
const normSkill = (s: string) =>
  s.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const SKILL_EFFECT: Record<string, string> = {};
for (const sk of weaponSkills) {
  const k = normSkill(sk.name);
  if (k && !(k in SKILL_EFFECT)) SKILL_EFFECT[k] = sk.effect;
}
function skillEffect(skill?: string | null): string | undefined {
  if (!skill) return undefined;
  return SKILL_EFFECT[normSkill(skill)] ?? SKILL_EFFECT[normSkill(skill.split(",")[0])];
}

// Weapon status text → status-effect icon key.
const STATUS_KEY: Record<string, StatusKey> = {
  "Blood Loss": "bleed",
  Frost: "frost",
  Madness: "madness",
  Poison: "poison",
  Rot: "rot",
  Sleep: "sleep",
};
/** Rarity sort rank — Common first, unranked last. */
const RARITY_RANK: Record<string, number> = { normal: 0, blue: 1, purple: 2, gold: 3 };

/** Scaling grades, best → worst. Index doubles as the sort rank. */
const GRADES = ["S", "A", "B", "C", "D", "E"];
const gradeRank = (g?: string | null) => (g ? GRADES.indexOf(g) : 99);

/** Elemental affinities in canonical order, for detecting split-affinity weapons. */
const ELEMENTS: Element[] = ["magic", "fire", "lightning", "holy"];
/** A weapon's two elemental affinities, if it deals exactly two (e.g. Sword of Night and Flame). */
function splitAffinity(w: Weapon): [Element, Element] | null {
  const present = ELEMENTS.filter((e) => (w.ap?.[e] ?? 0) > 0);
  return present.length === 2 ? (present as [Element, Element]) : null;
}

export function WeaponsReference() {
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [status, setStatus] = useState("all");
  const [scaleAttr, setScaleAttr] = useState("all");
  const [grades, setGrades] = useState<string[]>([]);
  const [rarity, setRarity] = useState("all");

  const allTypes = useMemo(() => Array.from(new Set(weapons.map((w) => w.type))).sort(), []);
  const statuses = useMemo(
    () => Array.from(new Set(weapons.map((w) => w.status).filter(Boolean) as string[])).sort(),
    [],
  );

  const q = query.trim().toLowerCase();
  const typeSet = new Set(types);
  const gradeSet = new Set(grades);
  const attr = scaleAttr === "all" ? null : (scaleAttr as keyof NonNullable<Weapon["scaling"]>);

  const list = weapons
    .filter((w) => {
      if (typeSet.size && !typeSet.has(w.type)) return false;
      if (status !== "all" && w.status !== status) return false;
      if (rarity !== "all" && w.rarity !== rarity) return false;
      if (attr) {
        const g = w.scaling?.[attr];
        if (!g) return false; // must scale with the chosen attribute
        if (gradeSet.size && !gradeSet.has(g)) return false; // within chosen grades
      }
      if (q && !w.name.toLowerCase().includes(q) && !(w.skill?.toLowerCase().includes(q) ?? false)) return false;
      return true;
    })
    .sort((a, b) => {
      const t = TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
      if (t !== 0) return t;
      // With a scaling attribute chosen, best grade rises to the top of its type.
      if (attr) {
        const g = gradeRank(a.scaling?.[attr]) - gradeRank(b.scaling?.[attr]);
        if (g !== 0) return g;
      }
      const r = (a.rarity ? RARITY_RANK[a.rarity] : 4) - (b.rarity ? RARITY_RANK[b.rarity] : 4);
      if (r !== 0) return r;
      return a.name.localeCompare(b.name);
    });

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search weapons by name or skill…"
          className="w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint focus:border-gold-faint focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Type">
            <MultiSelect
              values={types}
              onChange={setTypes}
              placeholder="All types"
              options={allTypes.map((t) => ({ value: t, label: t }))}
            />
          </Field>
          <Select label="Status" value={status} onChange={setStatus} options={statuses} />
          <Select label="Rarity" value={rarity} onChange={setRarity} options={["normal", "blue", "purple", "gold"]} labels={{ normal: "Common", blue: "Rare", purple: "Epic", gold: "Legendary" }} />
          <Select label="Scale for" value={scaleAttr} onChange={(v) => { setScaleAttr(v); if (v === "all") setGrades([]); }} options={SCALING_STATS.map((s) => s.key)} labels={Object.fromEntries(SCALING_STATS.map((s) => [s.key, s.label]))} placeholder="Any attribute" />
          <Field label="Grades">
            <MultiSelect
              values={grades}
              onChange={setGrades}
              placeholder={attr ? "All grades" : "Pick an attribute"}
              options={GRADES.map((g) => ({ value: g, label: g }))}
            />
          </Field>
        </div>
      </div>

      <p className="mb-2 font-body text-xs text-parchment-faint">
        {list.length} of {weapons.length} weapons
      </p>

      {weapons.length === 0 ? (
        <p className="rounded-md border border-night-600 bg-night-800/50 px-4 py-10 text-center font-body text-parchment-muted">
          Weapon data not loaded yet.
        </p>
      ) : (
        <div className="frame max-h-[75vh] overflow-auto rounded-lg">
          <table className="w-full border-collapse text-left font-body text-sm">
            <thead>
              <tr className="text-parchment-faint">
                <th className="sticky left-0 top-0 z-30 border-b border-night-600 bg-night-850 px-3 py-2.5 font-semibold">Name</th>
                <th className="sticky top-0 z-20 border-b border-night-600 bg-night-850 px-2.5 py-2.5 font-semibold">Type</th>
                <th className="sticky top-0 z-20 border-b border-night-600 bg-night-850 px-2.5 py-2.5 font-semibold">Dmg</th>
                {AP_COLUMNS.map((c) => (
                  <th key={c.key} className="sticky top-0 z-20 border-b border-night-600 bg-night-850 px-2.5 py-2.5 text-right font-semibold">
                    {AFFINITY_ICON[c.key] ? (
                      <Image src={asset(AFFINITY_ICON[c.key])} alt={c.label} title={c.label} width={18} height={18} className="ml-auto" />
                    ) : (
                      c.label
                    )}
                  </th>
                ))}
                {SCALING_STATS.map((s) => (
                  <th key={s.key} className="sticky top-0 z-20 border-b border-night-600 bg-night-850 px-2.5 py-2.5 text-center font-semibold">{s.label}</th>
                ))}
                <th className="sticky top-0 z-20 border-b border-night-600 bg-night-850 px-2.5 py-2.5 font-semibold">Status</th>
                <th className="sticky top-0 z-20 border-b border-night-600 bg-night-850 px-2.5 py-2.5 font-semibold">Skill</th>
              </tr>
            </thead>
            <tbody>
              {list.map((w) => (
                <Row key={`${w.type}:${w.name}`} w={w} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 font-body text-xs text-parchment-faint">
        Scaling grades S–E; blank = no scaling. {WEAPON_CREDIT}.
      </p>
    </div>
  );
}

function Row({ w }: { w: Weapon }) {
  const eff = skillEffect(w.skill);
  const split = splitAffinity(w);
  return (
    <tr className="border-b border-night-800/70 hover:bg-night-800/60">
      <td className="sticky left-0 z-10 bg-night-900 px-3 py-2.5 font-display font-semibold">
        <div className="flex items-center gap-2.5">
          <WeaponIcon
            src={iconFor({ name: w.name, type: w.type })}
            alt={w.name}
            size={44}
            frame={w.rarity ? RARITY_FRAMES[w.rarity] : undefined}
            ring={w.rarity ? RARITY_META[w.rarity].color : undefined}
          />
          <span
            className={w.rarity ? "" : "text-parchment"}
            style={w.rarity ? { color: RARITY_META[w.rarity].color } : undefined}
            title={w.rarity ? RARITY_META[w.rarity].label : undefined}
          >
            {w.name}
          </span>
          {split && (
            <RecipeAffinityIcon
              src={splitIcon(split[0], split[1])}
              alt={`${split[0]}/${split[1]} split affinity`}
              size={18}
              split
            />
          )}
        </div>
      </td>
      <td className="px-2.5 py-2.5 text-parchment-muted">{w.type}</td>
      <td className="px-2.5 py-2.5">
        <div className="flex items-center gap-1">
          {damageTypesFor(w.name, w.type).map((dt) => (
            <Image
              key={dt}
              src={asset(DAMAGE_TYPE_ICON[dt])}
              alt={DAMAGE_TYPE_LABEL[dt]}
              title={DAMAGE_TYPE_LABEL[dt]}
              width={18}
              height={18}
            />
          ))}
        </div>
      </td>
      {AP_COLUMNS.map((c) => {
        const v = w.ap?.[c.key];
        return (
          <td key={c.key} className="px-2.5 py-2.5 text-right tabular-nums text-parchment-muted">
            {v ? v : <span className="text-parchment-faint">–</span>}
          </td>
        );
      })}
      {SCALING_STATS.map((s) => {
        const g = w.scaling?.[s.key];
        return (
          <td key={s.key} className="px-2.5 py-2.5 text-center">
            {g ? <span className="font-semibold text-gold-dim">{g}</span> : <span className="text-parchment-faint">–</span>}
          </td>
        );
      })}
      <td className="px-2.5 py-2.5">
        {w.status && STATUS_KEY[w.status] ? (
          <Image
            src={asset(STATUS_ICON[STATUS_KEY[w.status]])}
            alt={w.status}
            title={w.status}
            width={22}
            height={22}
            className="inline-block"
          />
        ) : w.status ? (
          <span className="rounded border border-red-500/40 px-1.5 py-0.5 text-xs text-red-300">{w.status}</span>
        ) : (
          <span className="text-parchment-faint">–</span>
        )}
      </td>
      <td className="px-2.5 py-2.5 text-parchment-muted">
        {w.skill ? (
          eff ? (
            <span
              title={eff}
              className="cursor-help underline decoration-dotted decoration-night-500 underline-offset-2"
            >
              {w.skill}
            </span>
          ) : (
            w.skill
          )
        ) : (
          "–"
        )}
      </td>
    </tr>
  );
}

/** Labelled wrapper so MultiSelect controls line up with the Select fields. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-[0.6rem] uppercase tracking-wide text-parchment-faint">{label}</span>
      {children}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labels,
  placeholder = "All",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Dropdown
        value={value}
        clearable={false}
        onChange={onChange}
        options={[{ value: "all", label: placeholder }, ...options.map((o) => ({ value: o, label: labels?.[o] ?? o }))]}
      />
    </Field>
  );
}
