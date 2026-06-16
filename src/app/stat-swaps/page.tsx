import { StatSwaps } from "@/components/StatSwaps";

export default function StatSwapsPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Relic Effect</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Stat Swaps
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          A relic that trades some of a Nightfarer&rsquo;s stats for others. Pick
          a character to contrast each swap against their default — changes are
          shown as bracketed deltas.
        </p>
      </header>

      <StatSwaps />
    </div>
  );
}
