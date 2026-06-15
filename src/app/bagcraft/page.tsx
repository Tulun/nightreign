import { BagcraftReference } from "@/components/BagcraftReference";

export default function BagcraftPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Scholar</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Bagcraft
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Consumables the Scholar can upgrade by repeated use. Filter by category
          and compare each item&rsquo;s level 1, 2, and 3 effects.
        </p>
      </header>

      <BagcraftReference />
    </div>
  );
}
