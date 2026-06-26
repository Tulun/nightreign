"use client";

import { useMemo, useState } from "react";
import { weaponSkills } from "@/data/weaponSkills";
import { WeaponIcon } from "@/components/WeaponIcon";

export function WeaponSkillsReference() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const list = useMemo(() => {
    if (!q) return weaponSkills;
    return weaponSkills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.armaments.toLowerCase().includes(q) ||
        s.effect.toLowerCase().includes(q),
    );
  }, [q]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search skills by name, armament, or effect…"
        className="mb-3 w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-body text-sm text-parchment placeholder:text-parchment-faint focus:border-gold-faint focus:outline-none"
      />
      <p className="mb-3 font-body text-xs text-parchment-faint">
        {list.length} of {weaponSkills.length} skills
      </p>

      <ul className="space-y-3">
        {list.map((s) => (
          <li key={s.id} className="frame flex gap-4 rounded-lg bg-night-800/60 p-4">
            <WeaponIcon src={`/icons/weapon-skills/${s.id}.png`} alt={s.name} size={84} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h3 className="font-display text-xl font-semibold text-parchment">{s.name}</h3>
                <span className="font-body text-sm font-semibold text-gold-dim">{s.fp} FP</span>
              </div>
              <p className="mt-1 font-body text-sm uppercase tracking-[0.03em] text-parchment-faint">
                {s.armaments}
              </p>
              <p className="mt-1.5 font-body text-base leading-relaxed text-parchment-muted">{s.effect}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 font-body text-xs text-parchment-faint">
        FP shown as base (follow-up/charged) where applicable. &quot;Specific armaments&quot; means
        the skill is innate to a unique weapon. Data from eldenringnightreign.wiki.fextralife.com.
      </p>
    </div>
  );
}
