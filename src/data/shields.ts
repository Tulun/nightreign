// ─────────────────────────────────────────────────────────────────────────
//  Small & medium shields — Guarded Damage Negation (%) + Guard Boost.
//
//  Greatshields live in src/data/greatshields.ts (their own view). Small and
//  medium shields are catalogued here with the same negation block. Physical is
//  100 for every shield; the other affinities and Guard Boost are per-shield.
//
//  Source: eldenringnightreign.wiki.fextralife.com (individual shield pages).
// ─────────────────────────────────────────────────────────────────────────

export type ShieldClass = "small" | "medium";

/** Guarded Damage Negation (%), one value per affinity. Physical is 100. */
export interface ShieldNegation {
  physical: number;
  magic: number;
  fire: number;
  lightning: number;
  holy: number;
}

export interface Shield {
  /** Slug + icon key, e.g. "kite-shield" → /icons/medium-shields/kite-shield.png. */
  id: string;
  name: string;
  class: ShieldClass;
  negation: ShieldNegation;
  /** Guard Boost (stability). */
  guardBoost: number;
}

export const shields: Shield[] = [
  // ── Small shields ─────────────────────────────────────────────────────────
  { id: "blue-white-wooden-shield", name: "Blue-White Wooden Shield", class: "small", negation: { physical: 100, magic: 44, fire: 34, lightning: 21, holy: 41 }, guardBoost: 43 },
  { id: "buckler", name: "Buckler", class: "small", negation: { physical: 100, magic: 41, fire: 41, lightning: 21, holy: 41 }, guardBoost: 42 },
  { id: "coil-shield", name: "Coil Shield", class: "small", negation: { physical: 100, magic: 40, fire: 29, lightning: 37, holy: 38 }, guardBoost: 69 },
  { id: "gilded-iron-shield", name: "Gilded Iron Shield", class: "small", negation: { physical: 100, magic: 39, fire: 37, lightning: 17, holy: 51 }, guardBoost: 55 },
  { id: "ice-crest-shield", name: "Ice Crest Shield", class: "small", negation: { physical: 100, magic: 55, fire: 39, lightning: 17, holy: 33 }, guardBoost: 56 },
  { id: "iron-roundshield", name: "Iron Roundshield", class: "small", negation: { physical: 100, magic: 42, fire: 42, lightning: 18, holy: 42 }, guardBoost: 54 },
  { id: "man-serpents-shield", name: "Man-Serpent's Shield", class: "small", negation: { physical: 100, magic: 38, fire: 52, lightning: 19, holy: 35 }, guardBoost: 58 },
  { id: "perfumers-shield", name: "Perfumer's Shield", class: "small", negation: { physical: 100, magic: 42, fire: 42, lightning: 18, holy: 42 }, guardBoost: 68 },
  { id: "pillory-shield", name: "Pillory Shield", class: "small", negation: { physical: 100, magic: 43, fire: 22, lightning: 36, holy: 43 }, guardBoost: 41 },
  { id: "red-thorn-roundshield", name: "Red Thorn Roundshield", class: "small", negation: { physical: 100, magic: 30, fire: 40, lightning: 35, holy: 35 }, guardBoost: 39 },
  { id: "rickety-shield", name: "Rickety Shield", class: "small", negation: { physical: 100, magic: 35, fire: 29, lightning: 40, holy: 40 }, guardBoost: 37 },
  { id: "rift-shield", name: "Rift Shield", class: "small", negation: { physical: 100, magic: 38, fire: 43, lightning: 20, holy: 43 }, guardBoost: 52 },
  { id: "riveted-wooden-shield", name: "Riveted Wooden Shield", class: "small", negation: { physical: 100, magic: 42, fire: 30, lightning: 23, holy: 45 }, guardBoost: 41 },
  { id: "scripture-wooden-shield", name: "Scripture Wooden Shield", class: "small", negation: { physical: 100, magic: 39, fire: 21, lightning: 36, holy: 44 }, guardBoost: 40 },
  { id: "shield-of-the-guilty", name: "Shield of the Guilty", class: "small", negation: { physical: 100, magic: 37, fire: 37, lightning: 32, holy: 38 }, guardBoost: 69 },
  { id: "smoldering-shield", name: "Smoldering Shield", class: "small", negation: { physical: 100, magic: 37, fire: 56, lightning: 14, holy: 37 }, guardBoost: 70 },
  { id: "spiralhorn-shield", name: "Spiralhorn Shield", class: "small", negation: { physical: 100, magic: 35, fire: 39, lightning: 39, holy: 31 }, guardBoost: 71 },
  { id: "wylders-small-shield", name: "Wylder's Small Shield", class: "small", negation: { physical: 100, magic: 41, fire: 41, lightning: 21, holy: 41 }, guardBoost: 40 },

  // ── Medium shields ────────────────────────────────────────────────────────
  { id: "albinauric-shield", name: "Albinauric Shield", class: "medium", negation: { physical: 100, magic: 64, fire: 41, lightning: 22, holy: 45 }, guardBoost: 75 },
  { id: "banished-knights-shield", name: "Banished Knight's Shield", class: "medium", negation: { physical: 100, magic: 46, fire: 53, lightning: 28, holy: 45 }, guardBoost: 77 },
  { id: "beast-crest-heater-shield", name: "Beast Crest Heater Shield", class: "medium", negation: { physical: 100, magic: 52, fire: 44, lightning: 33, holy: 43 }, guardBoost: 53 },
  { id: "beastmans-jar-shield", name: "Beastman's Jar-Shield", class: "medium", negation: { physical: 100, magic: 26, fire: 47, lightning: 52, holy: 47 }, guardBoost: 75 },
  { id: "black-leather-shield", name: "Black Leather Shield", class: "medium", negation: { physical: 100, magic: 46, fire: 31, lightning: 47, holy: 48 }, guardBoost: 62 },
  { id: "blue-crest-heater-shield", name: "Blue Crest Heater Shield", class: "medium", negation: { physical: 100, magic: 44, fire: 43, lightning: 33, holy: 52 }, guardBoost: 51 },
  { id: "blue-gold-kite-shield", name: "Blue-Gold Kite Shield", class: "medium", negation: { physical: 100, magic: 45, fire: 51, lightning: 33, holy: 43 }, guardBoost: 62 },
  { id: "brass-shield", name: "Brass Shield", class: "medium", negation: { physical: 100, magic: 46, fire: 49, lightning: 32, holy: 45 }, guardBoost: 75 },
  { id: "candletree-wooden-shield", name: "Candletree Wooden Shield", class: "medium", negation: { physical: 100, magic: 43, fire: 33, lightning: 52, holy: 44 }, guardBoost: 50 },
  { id: "carian-knights-shield", name: "Carian Knight's Shield", class: "medium", negation: { physical: 100, magic: 71, fire: 28, lightning: 19, holy: 54 }, guardBoost: 74 },
  { id: "eclipse-crest-heater-shield", name: "Eclipse Crest Heater Shield", class: "medium", negation: { physical: 100, magic: 45, fire: 45, lightning: 37, holy: 45 }, guardBoost: 52 },
  { id: "flame-crest-wooden-shield", name: "Flame Crest Wooden Shield", class: "medium", negation: { physical: 100, magic: 44, fire: 33, lightning: 43, holy: 52 }, guardBoost: 49 },
  { id: "great-turtle-shell", name: "Great Turtle Shell", class: "medium", negation: { physical: 100, magic: 44, fire: 39, lightning: 43, holy: 46 }, guardBoost: 74 },
  { id: "hawk-crest-wooden-shield", name: "Hawk Crest Wooden Shield", class: "medium", negation: { physical: 100, magic: 46, fire: 34, lightning: 46, holy: 46 }, guardBoost: 49 },
  { id: "heater-shield", name: "Heater Shield", class: "medium", negation: { physical: 100, magic: 47, fire: 47, lightning: 31, holy: 47 }, guardBoost: 51 },
  { id: "horse-crest-wooden-shield", name: "Horse Crest Wooden Shield", class: "medium", negation: { physical: 100, magic: 52, fire: 33, lightning: 44, holy: 43 }, guardBoost: 49 },
  { id: "inverted-hawk-heater-shield", name: "Inverted Hawk Heater Shield", class: "medium", negation: { physical: 100, magic: 47, fire: 47, lightning: 31, holy: 47 }, guardBoost: 50 },
  { id: "kite-shield", name: "Kite Shield", class: "medium", negation: { physical: 100, magic: 46, fire: 46, lightning: 34, holy: 46 }, guardBoost: 64 },
  { id: "large-leather-shield", name: "Large Leather Shield", class: "medium", negation: { physical: 100, magic: 49, fire: 35, lightning: 45, holy: 39 }, guardBoost: 61 },
  { id: "marred-leather-shield", name: "Marred Leather Shield", class: "medium", negation: { physical: 100, magic: 48, fire: 36, lightning: 44, holy: 44 }, guardBoost: 47 },
  { id: "marred-wooden-shield", name: "Marred Wooden Shield", class: "medium", negation: { physical: 100, magic: 51, fire: 26, lightning: 48, holy: 47 }, guardBoost: 49 },
  { id: "red-crest-heater-shield", name: "Red Crest Heater Shield", class: "medium", negation: { physical: 100, magic: 43, fire: 52, lightning: 33, holy: 44 }, guardBoost: 51 },
  { id: "round-shield", name: "Round Shield", class: "medium", negation: { physical: 100, magic: 47, fire: 34, lightning: 40, holy: 47 }, guardBoost: 48 },
  { id: "scorpion-kite-shield", name: "Scorpion Kite Shield", class: "medium", negation: { physical: 100, magic: 44, fire: 45, lightning: 33, holy: 50 }, guardBoost: 63 },
  { id: "silver-mirrorshield", name: "Silver Mirrorshield", class: "medium", negation: { physical: 100, magic: 92, fire: 32, lightning: 20, holy: 28 }, guardBoost: 76 },
  { id: "sun-realm-shield", name: "Sun Realm Shield", class: "medium", negation: { physical: 100, magic: 45, fire: 28, lightning: 41, holy: 58 }, guardBoost: 60 },
  { id: "twinbird-kite-shield", name: "Twinbird Kite Shield", class: "medium", negation: { physical: 100, magic: 52, fire: 53, lightning: 30, holy: 37 }, guardBoost: 65 },
];
