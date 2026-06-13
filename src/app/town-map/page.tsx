import { sets } from "@/data/sets";
import { SetCard } from "@/components/SetCard";

export default function TownMapPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Quick Reference</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Town Map Seeds
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Twenty-one sets (0–20), each shown by its signature weapon. Select a
          set to view its Special Merchant stock and passives.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sets.map((set) => (
          <SetCard key={set.id} set={set} />
        ))}
      </div>
    </div>
  );
}
