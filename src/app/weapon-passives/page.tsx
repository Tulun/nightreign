import { WeaponPassives } from "@/components/WeaponPassives";

export default function WeaponPassivesPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Reference</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Weapon Passives
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Every weapon passive effect, whether it stacks with itself, and notes. Switch between the
          Normal and Deep pools — Deep weapons add their own effects plus Curse drawbacks. “Power of …”
          effects are grouped under Unique; some effects only stack across different tiers.
        </p>
      </header>

      <WeaponPassives />
    </div>
  );
}
