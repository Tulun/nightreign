import Image from "next/image";
import { asset } from "@/lib/assets";
import { CHARACTER_ORDER } from "@/lib/relics";
import {
  UNIQUE_RELIC_COLOR_HEX,
  UNIQUE_RELIC_CREDIT,
  uniqueRelics,
  type UniqueRelic,
} from "@/data/uniqueRelics";

/**
 * Unique relics browser: boss relics (Nightlord remembrances, Everdark
 * Sovereign purchases, other boss drops), the general shop uniques, and each
 * Nightfarer's character relics — with their in-game look, color, and effects.
 */
export function UniqueRelics() {
  const byGroup = (g: UniqueRelic["group"]) => uniqueRelics.filter((r) => r.group === g);
  const characterRelics = byGroup("character");

  return (
    <div className="space-y-10">
      <Section
        title="Boss Relics"
        note="Awarded for a Nightlord's first defeat, or bought from the Collector Signboard once its Everdark Sovereign falls."
      >
        <SubSection title="Nightlord Remembrances" relics={byGroup("nightlord")} />
        <SubSection title="Everdark Sovereigns" relics={byGroup("everdark")} />
        <SubSection title="Other Bosses" relics={byGroup("boss")} />
      </Section>

      <Section title="General Uniques" note="Fixed shop relics any Nightfarer can slot.">
        <RelicGrid relics={byGroup("shop")} />
      </Section>

      <Section
        title="Character Relics"
        note="Each Nightfarer's own relics, from their Remembrance quests or the Collector Signboard."
      >
        {CHARACTER_ORDER.map((name) => {
          const relics = characterRelics.filter((r) => r.character === name);
          return relics.length > 0 ? <SubSection key={name} title={name} relics={relics} /> : null;
        })}
      </Section>

      <p className="font-body text-xs text-parchment-faint">{UNIQUE_RELIC_CREDIT}</p>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-2xl font-bold text-parchment">{title}</h3>
      {note && <p className="mt-1 max-w-prose font-body text-sm text-parchment-muted">{note}</p>}
      <div className="mt-4 space-y-6">{children}</div>
    </section>
  );
}

function SubSection({ title, relics }: { title: string; relics: UniqueRelic[] }) {
  return (
    <div>
      <h4 className="eyebrow mb-2 text-parchment-faint">{title}</h4>
      <RelicGrid relics={relics} />
    </div>
  );
}

function RelicGrid({ relics }: { relics: UniqueRelic[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {relics.map((r) => (
        <RelicCard key={`${r.name}-${r.source}`} relic={r} />
      ))}
    </div>
  );
}

function RelicCard({ relic }: { relic: UniqueRelic }) {
  const hex = UNIQUE_RELIC_COLOR_HEX[relic.color];
  return (
    <article className="frame flex flex-col items-center rounded-md bg-night-800 p-4 text-center">
      <div
        className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded bg-night-900"
        style={{ boxShadow: `inset 0 0 0 1px ${hex}66` }}
      >
        <Image
          src={asset(`/icons/relics/${relic.icon}`)}
          alt={relic.name}
          fill
          sizes="96px"
          className="object-contain p-1"
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
        <h5 className="font-display font-semibold text-parchment">{relic.name}</h5>
        <span className="flex items-center gap-1 font-body text-xs text-parchment-faint">
          {/* The in-game diamond color marker for fixed relics */}
          <span aria-hidden="true" className="inline-block h-2 w-2 rotate-45" style={{ backgroundColor: hex }} />
          {relic.color}
        </span>
      </div>
      <ul className="mt-1 space-y-0.5">
        {relic.effects.map((effect) => (
          <li key={effect} className="font-body text-sm leading-snug text-parchment-muted">
            {effect}
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-2 font-body text-xs text-parchment-faint">{relic.source}</p>
    </article>
  );
}
