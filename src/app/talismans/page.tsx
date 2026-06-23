import { Talismans } from "@/components/Talismans";

export default function TalismansPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Reference</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">Talismans</h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Every talisman and its passive effect, filterable by category.
        </p>
      </header>

      <Talismans />
    </div>
  );
}
