import { ShieldsReference } from "@/components/ShieldsReference";

export default function ShieldsPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Armaments</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">Shields</h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Every shield — small, medium, and greatshield — with its Guarded Damage
          Negation per affinity and Guard Boost. Filter by class or sort by an
          affinity to find the best block.
        </p>
      </header>

      <ShieldsReference />
    </div>
  );
}
