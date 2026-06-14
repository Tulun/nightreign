import type { Greatshield } from "@/lib/greatshields";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  GREATSHIELD DATA  ·  Guarded Damage Negation (%)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Source: eldenringnightreign.wiki.fextralife.com (all 26 greatshields).
 *  Physical is 100 for every greatshield. The /greatshields view ranks them
 *  per affinity automatically, so each shield is listed once with its block.
 *
 *  Icons: drop square PNGs in /public/icons/greatshields/ named by id (e.g.
 *  "erdtree-greatshield.png") and add `icon: "/icons/greatshields/<id>.png"`.
 */
export const greatshields: Greatshield[] = [
  { id: "ants-skull-plate", name: "Ant's Skull Plate",
    negation: { physical: 100, magic: 64, fire: 48, lightning: 64, holy: 64 }, guardBoost: 78 },
  { id: "briar-greatshield", name: "Briar Greatshield",
    negation: { physical: 100, magic: 62, fire: 54, lightning: 62, holy: 62 }, guardBoost: 68 },
  { id: "crossed-tree-towershield", name: "Crossed-Tree Towershield",
    negation: { physical: 100, magic: 56, fire: 66, lightning: 52, holy: 66 }, guardBoost: 62 },
  { id: "crucible-hornshield", name: "Crucible Hornshield",
    negation: { physical: 100, magic: 58, fire: 57, lightning: 52, holy: 73 }, guardBoost: 81 },
  { id: "cuckoo-greatshield", name: "Cuckoo Greatshield",
    negation: { physical: 100, magic: 71, fire: 56, lightning: 52, holy: 61 }, guardBoost: 70 },
  { id: "distinguished-greatshield", name: "Distinguished Greatshield",
    negation: { physical: 100, magic: 64, fire: 62, lightning: 54, holy: 60 }, guardBoost: 70 },
  { id: "dragon-towershield", name: "Dragon Towershield",
    negation: { physical: 100, magic: 59, fire: 66, lightning: 53, holy: 62 }, guardBoost: 63 },
  { id: "dragonclaw-shield", name: "Dragonclaw Shield",
    negation: { physical: 100, magic: 55, fire: 55, lightning: 80, holy: 50 }, guardBoost: 80 },
  { id: "eclipse-crest-greatshield", name: "Eclipse Crest Greatshield",
    negation: { physical: 100, magic: 73, fire: 57, lightning: 51, holy: 59 }, guardBoost: 71 },
  { id: "erdtree-greatshield", name: "Erdtree Greatshield",
    negation: { physical: 100, magic: 67, fire: 50, lightning: 46, holy: 77 }, guardBoost: 81 },
  { id: "fingerprint-stone-shield", name: "Fingerprint Stone Shield",
    negation: { physical: 100, magic: 59, fire: 62, lightning: 61, holy: 58 }, guardBoost: 82 },
  { id: "gilded-greatshield", name: "Gilded Greatshield",
    negation: { physical: 100, magic: 59, fire: 65, lightning: 52, holy: 64 }, guardBoost: 72 },
  { id: "golden-beast-crest-shield", name: "Golden Beast Crest Shield",
    negation: { physical: 100, magic: 62, fire: 62, lightning: 54, holy: 62 }, guardBoost: 69 },
  { id: "golden-greatshield", name: "Golden Greatshield",
    negation: { physical: 100, magic: 57, fire: 60, lightning: 57, holy: 66 }, guardBoost: 73 },
  { id: "guardians-greatshield", name: "Guardian's Greatshield",
    icon: "/icons/greatshields/guardians-greatshield.png",
    negation: { physical: 100, magic: 59, fire: 66, lightning: 53, holy: 62 }, guardBoost: 60 },
  { id: "haligtree-crest-greatshield", name: "Haligtree Crest Greatshield",
    negation: { physical: 100, magic: 56, fire: 61, lightning: 50, holy: 73 }, guardBoost: 70 },
  { id: "icon-shield", name: "Icon Shield",
    negation: { physical: 100, magic: 61, fire: 56, lightning: 63, holy: 60 }, guardBoost: 71 },
  { id: "inverted-hawk-towershield", name: "Inverted Hawk Towershield",
    negation: { physical: 100, magic: 65, fire: 56, lightning: 54, holy: 65 }, guardBoost: 60 },
  { id: "jellyfish-shield", name: "Jellyfish Shield",
    negation: { physical: 100, magic: 65, fire: 65, lightning: 50, holy: 60 }, guardBoost: 78 },
  { id: "lordsworns-shield", name: "Lordsworn's Shield",
    negation: { physical: 100, magic: 62, fire: 52, lightning: 63, holy: 63 }, guardBoost: 59 },
  { id: "manor-towershield", name: "Manor Towershield",
    negation: { physical: 100, magic: 66, fire: 66, lightning: 52, holy: 56 }, guardBoost: 61 },
  { id: "one-eyed-shield", name: "One-Eyed Shield",
    negation: { physical: 100, magic: 55, fire: 67, lightning: 57, holy: 61 }, guardBoost: 80 },
  { id: "redmane-greatshield", name: "Redmane Greatshield",
    negation: { physical: 100, magic: 57, fire: 73, lightning: 56, holy: 54 }, guardBoost: 69 },
  { id: "spiked-palisade-shield", name: "Spiked Palisade Shield",
    negation: { physical: 100, magic: 61, fire: 54, lightning: 65, holy: 60 }, guardBoost: 67 },
  { id: "visage-shield", name: "Visage Shield",
    negation: { physical: 100, magic: 55, fire: 72, lightning: 58, holy: 55 }, guardBoost: 79 },
  { id: "wooden-greatshield", name: "Wooden Greatshield",
    negation: { physical: 100, magic: 63, fire: 52, lightning: 65, holy: 60 }, guardBoost: 57 },
];
