import { FilteredSetGrid } from "@/components/FilteredSetGrid";

export default function TownMapPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Quick Reference</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Merchant Inventories
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Twenty-one seeds, each shown by its signature weapon. Select a seed to
          view its Super and Normal merchant stock — weapons, prices, passives,
          plus crystal tears and aromatics — and the Great Hollow Legendary
          merchant. Toggle Deep of Night to reveal item curses. Filter by weapon,
          passive, or legendary.
        </p>
      </header>

      <FilteredSetGrid />
    </div>
  );
}
