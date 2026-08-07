import { AggroReference } from "@/components/AggroReference";

export default function AggroPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Enemy Mechanics</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Aggro &amp; Targeting
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Enemies target whoever has the highest aggro score. Aggro is generated
          by the stagger tier of your attacks (not damage), plus flat modifiers
          from relics, guarding, revives, and proximity — and multiplies fast
          for players the enemy isn&apos;t looking at.
        </p>
      </header>

      <AggroReference />
    </div>
  );
}
