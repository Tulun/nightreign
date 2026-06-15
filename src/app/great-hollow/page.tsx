import { GreatHollowMaps } from "@/components/GreatHollowMaps";

export default function GreatHollowPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Shifting Earth</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Great Hollow Crystals
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Crystals spawn in one of four sets. Tap the crystals you can see and
          the maps narrow to the matching set — ambiguous picks (e.g. A/B) keep
          both lit until another crystal confirms which.
        </p>
      </header>

      <GreatHollowMaps />
    </div>
  );
}
