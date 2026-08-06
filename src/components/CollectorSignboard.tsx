import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/assets";
import { RelicGrid } from "@/components/UniqueRelics";
import { UNIQUE_RELIC_CREDIT, uniqueRelics, type UniqueRelic } from "@/data/uniqueRelics";

/**
 * Collector Signboard catalog: every relic the Roundtable Hold signboard
 * sells for Sovereign Sigils — the Dark Night boss relics and the
 * fixed-effect Grand Scenes — plus its non-relic wares and services for
 * completeness.
 */
export function CollectorSignboard() {
  const byGroup = (g: UniqueRelic["group"]) => uniqueRelics.filter((r) => r.group === g);

  return (
    <div className="space-y-10">
      <Section
        title="Dark Night Relics"
        note="Empowered takes on the Nightlord relics, 12 Sovereign Sigils each. Each one is stocked only after its Everdark Sovereign falls."
      >
        <RelicGrid relics={byGroup("everdark")} />
      </Section>

      <Section
        title="Grand Scene Relics"
        note="Fixed-effect relics in the generic Grand Scene looks, 3 Sovereign Sigils each. In-game every one is named plain “Grand … Scene” — the labels here just tell them apart. Several carry combinations a rolled relic never can."
      >
        <RelicGrid relics={byGroup("signboard")} />
      </Section>

      <Section title="Other Wares" note="The rest of the catalog, for the record.">
        <ul className="space-y-3">
          <WareRow icon="scenic-flatstone.png" name="Large Scenic Flatstone" price="5 Sovereign Sigils">
            A randomly rolled relic — the signboard&rsquo;s gacha.
          </WareRow>
          <WareRow name="Vessels" price="4 Sovereign Sigils each">
            Soot-Covered and Sealed urns, Decrepit and Forgotten goblets for every
            Nightfarer — the full list is on the{" "}
            <Link href="/chalices" className="text-gold underline-offset-2 hover:underline">
              Chalices
            </Link>{" "}
            page.
          </WareRow>
          <WareRow name="Garbs" price="5–20 Sovereign Sigils">
            Cosmetic skins: the Dawn and Darkness sets for each Nightfarer, plus a
            rack of classic Souls-flavored outfits.
          </WareRow>
        </ul>
      </Section>

      <Section title="Services" note="The signboard also offers a few one-off options outside the catalog.">
        <ul className="space-y-3">
          <WareRow name="Swap the Witch's Brooch" price="3 Sovereign Sigils per swap">
            Trades the Witch&rsquo;s Brooch for the Cracked Witch&rsquo;s Brooch or
            back — the two are functionally identical.
          </WareRow>
          <WareRow name="Conjure a shift in the earth" price="1 Sovereign Sigil (Great Hollow 2)">
            Pick which Shifting Earth event appears on your next expeditions.
          </WareRow>
          <WareRow name="Alter Great Site of Grace" price="1 Sovereign Sigil once">
            After Heolstor falls, restores the Great Site of Grace to its
            illuminated state; switching back and forth afterwards is free.
          </WareRow>
        </ul>
      </Section>

      <p className="font-body text-xs text-parchment-faint">{UNIQUE_RELIC_CREDIT}</p>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-2xl font-bold text-parchment">{title}</h3>
      {note && <p className="mt-1 max-w-prose font-body text-base text-parchment-muted">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function WareRow({
  icon,
  name,
  price,
  children,
}: {
  icon?: string;
  name: string;
  price: string;
  children: React.ReactNode;
}) {
  return (
    <li className="frame flex items-start gap-3 rounded-md bg-night-800 p-4">
      {icon && (
        <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded bg-night-900">
          <Image src={asset(`/icons/relics/${icon}`)} alt={name} fill sizes="48px" className="object-contain p-1" />
        </span>
      )}
      <div>
        <p className="font-display font-semibold text-parchment">
          {name} <span className="font-body text-xs font-normal text-parchment-faint">· {price}</span>
        </p>
        <p className="mt-0.5 max-w-prose font-body text-base leading-snug text-parchment-muted">{children}</p>
      </div>
    </li>
  );
}
