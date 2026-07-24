import { BuildsManager } from "@/components/BuildsManager";

export default function BuildsPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Nightfarers</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Builds
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Save your relic loadouts per Nightfarer. Slots draw from the fixed
          relics in the game plus your own custom relics — type effects with
          autocomplete, or parse them from a screenshot and fix any mistakes.
          Everything is stored in your browser; use Export to back up.
        </p>
      </header>

      <BuildsManager />
    </div>
  );
}
