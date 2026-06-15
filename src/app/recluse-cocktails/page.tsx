import { CocktailReference } from "@/components/CocktailReference";

export default function RecluseCocktailsPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Recluse</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Magic Cocktails
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Recluse&rsquo;s brews by element recipe, split Unholy / Holy. Each shows
          the three affinities it&rsquo;s mixed from and its effect.
        </p>
      </header>

      <CocktailReference />
    </div>
  );
}
