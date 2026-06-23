import { NegationCalculator } from "@/components/NegationCalculator";

export default function NegationPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Calculator</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">Negation Calculator</h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Pick a Nightfarer and stack negation buffs from weapon passives and relics to see your resulting damage
          negation per type. Everything stacks multiplicatively.
        </p>
      </header>

      <NegationCalculator />
    </div>
  );
}
