import type { Nightfarer } from "@/lib/characters";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  NIGHTFARERS · base stats
 * ─────────────────────────────────────────────────────────────────────────
 *  Negations are percentages; resistances are buildup thresholds. From the
 *  community stats sheet.
 */
export const nightfarers: Nightfarer[] = [
  {
    name: "Wylder", hp: 1120, fp: 140, stamina: 102, poise: 40,
    attributes: { vig: 52, mnd: 19, end: 27, str: 50, dex: 40, int: 15, fai: 15, arc: 10 },
    negations: { physical: 19, slash: 20, strike: 19, thrust: 20, magic: 19, fire: 19, lightning: 20, holy: 17 },
    resistances: { poison: 102, rot: 102, bleed: 95, frost: 95, sleep: 59, madness: 59, blight: 59 },
  },
  {
    name: "Guardian", hp: 1280, fp: 115, stamina: 124, poise: 120,
    attributes: { vig: 60, mnd: 14, end: 38, str: 41, dex: 31, int: 10, fai: 21, arc: 10 },
    negations: { physical: 24, slash: 25, strike: 24, thrust: 20, magic: 19, fire: 14, lightning: 15, holy: 17 },
    resistances: { poison: 112, rot: 112, bleed: 85, frost: 85, sleep: 69, madness: 69, blight: 59 },
  },
  {
    name: "Ironeye", hp: 820, fp: 115, stamina: 104, poise: 40,
    attributes: { vig: 37, mnd: 14, end: 28, str: 19, dex: 57, int: 7, fai: 13, arc: 13 },
    negations: { physical: 19, slash: 15, strike: 14, thrust: 15, magic: 19, fire: 14, lightning: 20, holy: 17 },
    resistances: { poison: 112, rot: 112, bleed: 85, frost: 85, sleep: 69, madness: 69, blight: 59 },
  },
  {
    name: "Duchess", hp: 860, fp: 180, stamina: 84, poise: 40,
    attributes: { vig: 39, mnd: 27, end: 18, str: 11, dex: 45, int: 42, fai: 27, arc: 11 },
    negations: { physical: 19, slash: 15, strike: 14, thrust: 15, magic: 28, fire: 22, lightning: 22, holy: 23 },
    resistances: { poison: 102, rot: 102, bleed: 85, frost: 85, sleep: 69, madness: 69, blight: 59 },
  },
  {
    name: "Raider", hp: 1200, fp: 95, stamina: 122, poise: 120,
    attributes: { vig: 56, mnd: 10, end: 37, str: 68, dex: 19, int: 3, fai: 12, arc: 10 },
    negations: { physical: 24, slash: 25, strike: 24, thrust: 15, magic: 14, fire: 24, lightning: 15, holy: 17 },
    resistances: { poison: 102, rot: 102, bleed: 95, frost: 95, sleep: 49, madness: 49, blight: 59 },
  },
  {
    name: "Revenant", hp: 760, fp: 200, stamina: 82, poise: 40,
    attributes: { vig: 34, mnd: 31, end: 17, str: 21, dex: 21, int: 30, fai: 51, arc: 12 },
    negations: { physical: 14, slash: 10, strike: 14, thrust: 10, magic: 28, fire: 29, lightning: 29, holy: 20 },
    resistances: { poison: 112, rot: 112, bleed: 85, frost: 85, sleep: 69, madness: 69, blight: 69 },
  },
  {
    name: "Recluse", hp: 740, fp: 195, stamina: 94, poise: 40,
    attributes: { vig: 33, mnd: 30, end: 23, str: 12, dex: 19, int: 51, fai: 51, arc: 10 },
    negations: { physical: 14, slash: 10, strike: 14, thrust: 10, magic: 29, fire: 24, lightning: 25, holy: 25 },
    resistances: { poison: 112, rot: 112, bleed: 85, frost: 85, sleep: 69, madness: 69, blight: 59 },
  },
  {
    name: "Executor", hp: 1000, fp: 100, stamina: 102, poise: 40,
    attributes: { vig: 46, mnd: 11, end: 27, str: 25, dex: 63, int: 8, fai: 6, arc: 28 },
    negations: { physical: 24, slash: 25, strike: 24, thrust: 25, magic: 14, fire: 19, lightning: 15, holy: 22 },
    resistances: { poison: 92, rot: 92, bleed: 105, frost: 105, sleep: 49, madness: 49, blight: 69 },
  },
  {
    name: "Scholar", hp: 900, fp: 145, stamina: 98, poise: 40,
    attributes: { vig: 41, mnd: 20, end: 25, str: 14, dex: 18, int: 28, fai: 15, arc: 50 },
    negations: { physical: 19, slash: 17, strike: 15, thrust: 20, magic: 27, fire: 25, lightning: 24, holy: 9 },
    resistances: { poison: 102, rot: 102, bleed: 85, frost: 59, sleep: 85, madness: 69, blight: 69 },
  },
  {
    name: "Undertaker", hp: 1040, fp: 115, stamina: 92, poise: 40,
    attributes: { vig: 48, mnd: 14, end: 22, str: 50, dex: 13, int: 5, fai: 41, arc: 10 },
    negations: { physical: 18, slash: 12, strike: 18, thrust: 12, magic: 20, fire: 17, lightning: 20, holy: 26 },
    resistances: { poison: 102, rot: 102, bleed: 85, frost: 79, sleep: 95, madness: 49, blight: 59 },
  },
];
