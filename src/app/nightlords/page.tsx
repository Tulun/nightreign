import { Nightlords } from "@/components/Nightlords";

export default function NightlordsPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Expedition Bosses</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Nightlords
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          The eight expedition end-bosses and the damage type each is weak to.
        </p>
      </header>

      <Nightlords />
    </div>
  );
}
