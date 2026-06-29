"use client";

import { useEffect, useState } from "react";
import { cocktails, COCKTAIL_CREDIT } from "@/data/cocktails";
import { COCKTAIL_CATEGORIES, recipeSlots, type Cocktail } from "@/lib/cocktails";
import { CocktailIcon } from "./CocktailIcon";
import { RecipeAffinityIcon } from "./RecipeAffinityIcon";

/** Recluse cocktails grouped Unholy / Holy, each showing its 3-element recipe. */
export function CocktailReference() {
  const [detail, setDetail] = useState<Cocktail | null>(null);

  // Escape closes the modal.
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDetail(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

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
                  <CocktailCard key={c.id} cocktail={c} onOpen={() => setDetail(c)} />
                ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 font-body text-xs text-parchment-faint">{COCKTAIL_CREDIT}</p>

      {detail && <CocktailModal cocktail={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function CocktailCard({ cocktail, onOpen }: { cocktail: Cocktail; onOpen: () => void }) {
  const iconSrc = cocktail.icon ?? `/icons/cocktails/${cocktail.id}.png`;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="frame flex h-full w-full flex-col items-center rounded-lg bg-night-800 p-3 text-center transition-colors hover:bg-night-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold-bright"
    >
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
      <span className="mt-2 font-body text-[0.65rem] uppercase tracking-wide text-gold-bright/70">
        Details
      </span>
    </button>
  );
}

function CocktailModal({ cocktail, onClose }: { cocktail: Cocktail; onClose: () => void }) {
  const iconSrc = cocktail.icon ?? `/icons/cocktails/${cocktail.id}.png`;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-[1px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={cocktail.name}
    >
      <div
        className="frame w-full max-w-sm rounded-lg bg-night-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 border-b border-night-600 pb-4">
          <CocktailIcon src={iconSrc} alt={cocktail.name} size={64} />
          <div className="min-w-0">
            <p className="eyebrow">Cocktail</p>
            <h3 className="font-display text-xl font-bold text-parchment">{cocktail.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto self-start text-lg leading-none text-parchment-faint transition-colors hover:text-gold"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5">
          {recipeSlots(cocktail.recipe).map((slot, i) => (
            <RecipeAffinityIcon key={i} src={slot.src} alt={slot.alt} split={slot.split} />
          ))}
        </div>

        <p className="mt-3 text-center font-body text-[0.7rem] uppercase tracking-wide text-parchment-faint">
          {cocktail.note}
        </p>

        <p className="mt-4 font-body text-sm leading-relaxed text-parchment-muted">
          {cocktail.description}
        </p>
      </div>
    </div>
  );
}
