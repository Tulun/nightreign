import { LibraDeals } from "@/components/LibraDeals";

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
    </div>
  );
}
