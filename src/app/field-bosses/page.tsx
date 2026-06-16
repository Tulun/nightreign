import { FieldBossLoot } from "@/components/FieldBossLoot";
import { LegendaryDrops } from "@/components/LegendaryDrops";
import {
  fieldBossTiers,
  poiTiers,
  redTiers,
  FIELD_BOSS_NOTE,
  POI_NOTE,
  RED_NOTE,
  FIELD_BOSS_CREDIT,
} from "@/data/fieldBosses";

export default function FieldBossesPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Drop Rates</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Boss Loot
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Loot pools by encounter. Pick a tier to see its bosses, per-slot drop
          chances, and the Dormant Power its power slot can roll.
        </p>
      </header>

      <section>
        <h3 className="mb-4 font-display text-2xl font-bold text-parchment">Field Bosses</h3>
        <FieldBossLoot tiers={fieldBossTiers} note={FIELD_BOSS_NOTE} />
      </section>

      <section className="mt-12 border-t border-night-600 pt-8">
        <h3 className="font-display text-2xl font-bold text-parchment">POI Bosses</h3>
        <p className="mb-5 mt-1 max-w-prose font-body text-parchment-muted">
          Forts, Cathedrals, Ruins &amp; Camps. The weapon dropped follows the
          POI&rsquo;s element — Standard or a matching elemental weapon.
        </p>
        <FieldBossLoot tiers={poiTiers} note={POI_NOTE} />
      </section>

      <section className="mt-12 border-t border-night-600 pt-8">
        <h3 className="font-display text-2xl font-bold text-parchment">Cursed Red Bosses</h3>
        <p className="mb-5 mt-1 max-w-prose font-body text-parchment-muted">
          Deep of Night (ranked) variants. They drop Red weapons and can roll the
          new S-Tier powers.
        </p>
        <FieldBossLoot tiers={redTiers} note={RED_NOTE} />
      </section>

      <section className="mt-12 border-t border-night-600 pt-8">
        <h3 className="mb-1 font-display text-2xl font-bold text-parchment">Legendary Drop Pool</h3>
        <p className="mb-5 mt-1 max-w-prose font-body text-parchment-muted">
          When a slot rolls a Legendary weapon, this is the chance it&rsquo;s each one.
        </p>
        <LegendaryDrops />
      </section>

      <p className="mt-8 font-body text-xs text-parchment-faint">{FIELD_BOSS_CREDIT}</p>
    </div>
  );
}
