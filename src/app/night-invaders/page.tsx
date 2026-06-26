import { NightInvaderReference } from "@/components/NightInvaderReference";

export default function NightInvadersPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Quick Reference</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Night Invader Drops
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          The drop-specific passives each Night Invader can give, by Nightfarer.
          Revenant has no Night Invader.
        </p>
      </header>

      <NightInvaderReference />
    </div>
  );
}
