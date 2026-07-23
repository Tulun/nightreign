import { UniqueRelics } from "@/components/UniqueRelics";

export default function UniqueRelicsPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Reference</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Unique Relics
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Fixed-effect relics with their own look — boss relics from Nightlords
          and Everdark Sovereigns, general shop uniques, and every
          Nightfarer&rsquo;s character relics, with their color and effects.
        </p>
      </header>

      <UniqueRelics />
    </div>
  );
}
