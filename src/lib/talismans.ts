// ─────────────────────────────────────────────────────────────────────────
//  Talismans — equippable accessories with passive effects. Category is
//  derived from the effect text for filtering.
// ─────────────────────────────────────────────────────────────────────────

export interface Talisman {
  name: string;
  effect: string;
}

export type TalismanCategory = "Negation" | "Resistance" | "Offensive" | "Regen" | "Stat" | "Utility";

export const TALISMAN_CATEGORIES: TalismanCategory[] = ["Offensive", "Negation", "Resistance", "Regen", "Stat", "Utility"];

/** Derive a category from the effect text (best-effort keyword match). */
export function talismanCategory(t: Talisman): TalismanCategory {
  const e = t.effect.toLowerCase();
  if (e.includes("attack power") || e.includes("attacks") || e.includes("guard counter") || e.includes("guard breaking") || e.includes("critical hit") || e.includes("charged") || e.includes("counterattack") || e.includes("incantation") || e.includes("sorcer") || e.includes("spell") || e.includes("perfuming") || e.includes("throwing") || e.includes("ranged")) return "Offensive";
  if (e.includes("negation") || e.includes("poise") || e.includes("guarding ability") || e.includes("dodging")) return "Negation";
  if (e.includes("resistance")) return "Resistance";
  if (e.includes("maximum hp") || e.includes("maximum fp") || e.includes("maximum stamina")) return "Stat";
  if (e.includes("restoration") || e.includes("recovery") || e.includes("restores")) return "Regen";
  return "Utility";
}

export const TALISMAN_CREDIT = "Effects from eldenringnightreign.wiki.fextralife.com";
