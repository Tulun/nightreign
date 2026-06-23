import { Nightfarers } from "@/components/Nightfarers";

export default function NightfarersPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Characters</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">Nightfarers</h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Base stats for each playable character — HP/FP/stamina, attributes, damage negations, status
          resistances, and poise.
        </p>
      </header>

      <Nightfarers />
    </div>
  );
}
