import { GreatshieldReference } from "@/components/GreatshieldReference";

export default function GreatshieldsPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Guardian Reference</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Greatshield Affinity Negation
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Preferred greatshields by damage type, ranked by guarded damage
          negation. Tap a shield for its full stat block.
        </p>
      </header>

      <GreatshieldReference />
    </div>
  );
}
