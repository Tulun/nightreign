import { BossCodex } from "@/components/BossCodex";

export default function BossesPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Boss Codex</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Night &amp; Field Bosses
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          End-of-day (Night 1 / Night 2) bosses and field bosses. Click any boss for its damage
          negations, status resistances, stance, and weaknesses.
        </p>
      </header>

      <BossCodex />
    </div>
  );
}
