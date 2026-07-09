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
          The expedition end-bosses and the damage type each is weak to — including the
          Forsaken Hollows additions (Balancers & Dreglord). Swap to the Everdark Sovereigns,
          pick your team size for scaled HP, or apply a Depths of Night modifier.
        </p>
      </header>

      <Nightlords />
    </div>
  );
}
