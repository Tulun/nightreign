import { MagicSpells } from "@/components/MagicSpells";

export default function MagicSpellsPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Sorceries &amp; Incantations</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Magic Spells
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Every spell grouped by school. In Nightreign spells carry no stat
          requirements &mdash; tap any spell for its FP cost, damage type, and effect.
        </p>
      </header>

      <MagicSpells />
    </div>
  );
}
