import { WeaponSkillsReference } from "@/components/WeaponSkillsReference";

export default function WeaponSkillsPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Armaments</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Weapon Skills
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Every weapon skill with its FP cost, compatible armaments, and effect.
          Search by name, weapon type, or what the skill does.
        </p>
      </header>

      <WeaponSkillsReference />
    </div>
  );
}
