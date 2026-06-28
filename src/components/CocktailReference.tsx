import { cocktails, COCKTAIL_CREDIT } from "@/data/cocktails";
import { COCKTAIL_CATEGORIES, recipeSlots, type Cocktail } from "@/lib/cocktails";
import { CocktailIcon } from "./CocktailIcon";
import { RecipeAffinityIcon } from "./RecipeAffinityIcon";

/** Recluse cocktails grouped Unholy / Holy, each showing its 3-element recipe. */
export function CocktailReference() {
  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-2">
        {COCKTAIL_CATEGORIES.map(({ key, label }) => (
          <section key={key}>
            <h3 className="mb-4 text-center font-display text-xl font-bold uppercase tracking-[0.12em] text-gold-bright">
              {label}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cocktails
                .filter((c) => c.category === key)
                .map((c) => (
                  <CocktailCard key={c.id} cocktail={c} />
                ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 font-body text-xs text-parchment-faint">{COCKTAIL_CREDIT}</p>
    </div>
  );
}

function CocktailCard({ cocktail }: { cocktail: Cocktail }) {
  const iconSrc = cocktail.icon ?? `/icons/cocktails/${cocktail.id}.png`;
  return (
    <div className="frame flex flex-col items-center rounded-lg bg-night-800 p-3 text-center">
      <div className="mb-2 flex items-center justify-center gap-1">
        {recipeSlots(cocktail.recipe).map((slot, i) => (
          <RecipeAffinityIcon key={i} src={slot.src} alt={slot.alt} split={slot.split} />
        ))}
      </div>
      <CocktailIcon src={iconSrc} alt={cocktail.name} size={56} />
      <p className="mt-2 font-display text-sm font-semibold leading-tight text-parchment">
        {cocktail.name}
      </p>
      <p className="mt-0.5 font-body text-[0.7rem] uppercase tracking-wide text-parchment-faint">
        {cocktail.note}
      </p>
    </div>
  );
}
