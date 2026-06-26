import { DepthBuffs } from "@/components/DepthBuffs";

export default function DepthBuffsPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Quick Reference</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Depth Buffs
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          How much HP and Damage each enemy type gains at each Depth (D1–D5).
          <span className="text-red-300"> R</span> is the extra buff a Red
          (empowered) variant gets, added on top of that depth&apos;s value;
          N/A means the enemy has no Red variant.
        </p>
      </header>

      <DepthBuffs />
    </div>
  );
}
