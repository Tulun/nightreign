import { seeds } from "@/data/seeds";
import { SeedCard } from "@/components/SeedCard";

export default function TownMapPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Quick Reference</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Town Map Seeds
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          The twenty town layouts and their signature weapon. Select a seed to
          view everything stocked by its town merchant.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {seeds.map((seed) => (
          <SeedCard key={seed.id} seed={seed} />
        ))}
      </div>
    </div>
  );
}
