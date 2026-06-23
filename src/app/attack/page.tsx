import { AttackCalculator } from "@/components/AttackCalculator";

export default function AttackPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Calculator</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">Attack Calculator</h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Enter your weapon&rsquo;s Attack Rating from the Sparring Grounds, set the damage-type split, and stack relic,
          passive and talisman buffs to see your resulting hit damage. Every buff is a separate multiplier.
        </p>
      </header>

      <AttackCalculator />
    </div>
  );
}
