// ─────────────────────────────────────────────────────────────────────────
//  Small & medium shields.
//
//  Greatshields live in src/data/greatshields.ts (they have full Guarded Damage
//  Negation blocks + their own view). Small and medium shields are catalogued
//  here by name + class so their icons resolve (/icons/<class>-shields/<id>.png)
//  and they're tracked for the town-map shop. Per-affinity negation / guard-boost
//  stats are not on the wiki's list page — add a `negation`/`guardBoost` field
//  here per shield if/when those are sourced.
//
//  Source: eldenringnightreign.wiki.fextralife.com/Shields
// ─────────────────────────────────────────────────────────────────────────

export type ShieldClass = "small" | "medium";

export interface Shield {
  /** Slug + icon key, e.g. "kite-shield" → /icons/medium-shields/kite-shield.png. */
  id: string;
  name: string;
  class: ShieldClass;
}

export const shields: Shield[] = [
  // ── Small shields ─────────────────────────────────────────────────────────
  { id: "blue-white-wooden-shield", name: "Blue-White Wooden Shield", class: "small" },
  { id: "buckler", name: "Buckler", class: "small" },
  { id: "coil-shield", name: "Coil Shield", class: "small" },
  { id: "gilded-iron-shield", name: "Gilded Iron Shield", class: "small" },
  { id: "ice-crest-shield", name: "Ice Crest Shield", class: "small" },
  { id: "iron-roundshield", name: "Iron Roundshield", class: "small" },
  { id: "man-serpents-shield", name: "Man-Serpent's Shield", class: "small" },
  { id: "perfumers-shield", name: "Perfumer's Shield", class: "small" },
  { id: "pillory-shield", name: "Pillory Shield", class: "small" },
  { id: "red-thorn-roundshield", name: "Red Thorn Roundshield", class: "small" },
  { id: "rickety-shield", name: "Rickety Shield", class: "small" },
  { id: "rift-shield", name: "Rift Shield", class: "small" },
  { id: "riveted-wooden-shield", name: "Riveted Wooden Shield", class: "small" },
  { id: "scripture-wooden-shield", name: "Scripture Wooden Shield", class: "small" },
  { id: "shield-of-the-guilty", name: "Shield of the Guilty", class: "small" },
  { id: "smoldering-shield", name: "Smoldering Shield", class: "small" },
  { id: "spiralhorn-shield", name: "Spiralhorn Shield", class: "small" },
  { id: "wylders-small-shield", name: "Wylder's Small Shield", class: "small" },

  // ── Medium shields ────────────────────────────────────────────────────────
  { id: "albinauric-shield", name: "Albinauric Shield", class: "medium" },
  { id: "banished-knights-shield", name: "Banished Knight's Shield", class: "medium" },
  { id: "beast-crest-heater-shield", name: "Beast Crest Heater Shield", class: "medium" },
  { id: "beastmans-jar-shield", name: "Beastman's Jar-Shield", class: "medium" },
  { id: "black-leather-shield", name: "Black Leather Shield", class: "medium" },
  { id: "blue-crest-heater-shield", name: "Blue Crest Heater Shield", class: "medium" },
  { id: "blue-gold-kite-shield", name: "Blue-Gold Kite Shield", class: "medium" },
  { id: "brass-shield", name: "Brass Shield", class: "medium" },
  { id: "candletree-wooden-shield", name: "Candletree Wooden Shield", class: "medium" },
  { id: "carian-knights-shield", name: "Carian Knight's Shield", class: "medium" },
  { id: "eclipse-crest-heater-shield", name: "Eclipse Crest Heater Shield", class: "medium" },
  { id: "flame-crest-wooden-shield", name: "Flame Crest Wooden Shield", class: "medium" },
  { id: "great-turtle-shell", name: "Great Turtle Shell", class: "medium" },
  { id: "hawk-crest-wooden-shield", name: "Hawk Crest Wooden Shield", class: "medium" },
  { id: "heater-shield", name: "Heater Shield", class: "medium" },
  { id: "horse-crest-wooden-shield", name: "Horse Crest Wooden Shield", class: "medium" },
  { id: "inverted-hawk-heater-shield", name: "Inverted Hawk Heater Shield", class: "medium" },
  { id: "kite-shield", name: "Kite Shield", class: "medium" },
  { id: "large-leather-shield", name: "Large Leather Shield", class: "medium" },
  { id: "marred-leather-shield", name: "Marred Leather Shield", class: "medium" },
  { id: "marred-wooden-shield", name: "Marred Wooden Shield", class: "medium" },
  { id: "red-crest-heater-shield", name: "Red Crest Heater Shield", class: "medium" },
  { id: "round-shield", name: "Round Shield", class: "medium" },
  { id: "scorpion-kite-shield", name: "Scorpion Kite Shield", class: "medium" },
  { id: "silver-mirrorshield", name: "Silver Mirrorshield", class: "medium" },
  { id: "sun-realm-shield", name: "Sun Realm Shield", class: "medium" },
  { id: "twinbird-kite-shield", name: "Twinbird Kite Shield", class: "medium" },
];
