import { LibraDeals } from "@/components/LibraDeals";
import { LibraStatTable } from "@/components/LibraStatTable";

export default function LibraPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Libra, Creature of Night</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Libra Deals
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          The Scale-Bearer offers three random deals from this pool — each a buff
          with a matching downside. Take one, or refuse.
        </p>
      </header>

      <LibraDeals />

      <section className="mt-12 border-t border-night-600 pt-8">
        <h2 className="font-display text-2xl font-bold text-parchment">Stat-Swap Deals</h2>
        <p className="mb-5 mt-1 max-w-prose font-body text-parchment-muted">
          The &ldquo;great strength/dexterity/&hellip;&rdquo; deals overwrite your
          statline with a fixed block. Compare each block against the
          Nightfarers&rsquo; native level-15 attributes.
        </p>
        <LibraStatTable />
      </section>
    </div>
  );
}
