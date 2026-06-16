import { RelicEffects } from "@/components/RelicEffects";

export default function RelicsPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Reference</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Relic Effects
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Every effect a relic can roll, grouped by category. No relic can carry two effects from the
          same category.
        </p>
      </header>

      <RelicEffects />
    </div>
  );
}
