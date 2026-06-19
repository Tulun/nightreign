import { WeaponsReference } from "@/components/WeaponsReference";

export default function WeaponsPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Armaments</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">Weapons</h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Every weapon, filterable by type, attribute scaling, innate status, and rarity. Columns show
          attack power per element and scaling grades.
        </p>
      </header>

      <WeaponsReference />
    </div>
  );
}
