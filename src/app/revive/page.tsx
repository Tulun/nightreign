import { ReviveReference } from "@/components/ReviveReference";

export default function RevivePage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Nightfarer Mechanics</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Revive Damage
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Standing a felled teammate up means dealing damage to their
          near-death gauge — but revive damage is its own hidden stat, set by
          weapon class and attack, not by the damage you actually deal. Here
          is what every attack, spell, and skill contributes.
        </p>
      </header>

      <ReviveReference />
    </div>
  );
}
