import { CollectorSignboard } from "@/components/CollectorSignboard";

export default function CollectorSignboardPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Reference</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Collector Signboard
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          The wooden shield outside the Roundtable Hold&rsquo;s south exit,
          open once any Everdark Sovereign has fallen. It sells relics,
          vessels, and garbs for Sovereign Sigils — the currency earned from
          Everdark Sovereign expeditions.
        </p>
      </header>

      <CollectorSignboard />
    </div>
  );
}
