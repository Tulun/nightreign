import type { BlockWeapon } from "@/lib/blockWeapons";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  COLOSSAL SWORDS & COLOSSAL WEAPONS — Guarded Damage Negation by affinity
 *  plus Guard Boost. Physical guard is 100 on every colossal armament (fully
 *  blocked), so only affinity values are stored. Source: Fextralife wiki.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const colossalSwords: BlockWeapon[] = [
  { id: "godslayer-s-greatsword", name: "Godslayer's Greatsword", negation: { magic: 38, fire: 49, lightning: 38, holy: 38 }, guardBoost: 48 },
  { id: "grafted-blade-greatsword", name: "Grafted Blade Greatsword", negation: { magic: 48, fire: 48, lightning: 48, holy: 48 }, guardBoost: 48 },
  { id: "greatsword", name: "Greatsword", negation: { magic: 50, fire: 50, lightning: 50, holy: 50 }, guardBoost: 48 },
  { id: "maliketh-s-black-blade", name: "Maliketh's Black Blade", negation: { magic: 36, fire: 36, lightning: 36, holy: 49 }, guardBoost: 48 },
  { id: "royal-greatsword", name: "Royal Greatsword", negation: { magic: 63, fire: 44, lightning: 44, holy: 44 }, guardBoost: 48 },
  { id: "ruins-greatsword", name: "Ruins Greatsword", negation: { magic: 56, fire: 50, lightning: 50, holy: 50 }, guardBoost: 48 },
  { id: "starscourge-greatsword", name: "Starscourge Greatsword", negation: { magic: 47, fire: 34, lightning: 34, holy: 34 }, guardBoost: 48 },
  { id: "troll-knight-s-sword", name: "Troll Knight's Sword", negation: { magic: 55, fire: 43, lightning: 43, holy: 43 }, guardBoost: 48 },
  { id: "troll-s-golden-sword", name: "Troll's Golden Sword", negation: { magic: 46, fire: 46, lightning: 46, holy: 46 }, guardBoost: 48 },
  { id: "watchdog-s-greatsword", name: "Watchdog's Greatsword", negation: { magic: 49, fire: 49, lightning: 49, holy: 49 }, guardBoost: 48 },
  { id: "zweihander", name: "Zweihander", negation: { magic: 40, fire: 40, lightning: 40, holy: 40 }, guardBoost: 48 },
];

export const colossalWeapons: BlockWeapon[] = [
  { id: "axe-of-godfrey", name: "Axe of Godfrey", negation: { magic: 45, fire: 45, lightning: 45, holy: 45 }, guardBoost: 48 },
  { id: "dragon-greatclaw", name: "Dragon Greatclaw", negation: { magic: 40, fire: 40, lightning: 52, holy: 40 }, guardBoost: 48 },
  { id: "duelist-greataxe", name: "Duelist Greataxe", negation: { magic: 47, fire: 47, lightning: 47, holy: 47 }, guardBoost: 48 },
  { id: "envoy-s-greathorn", name: "Envoy's Greathorn", negation: { magic: 43, fire: 43, lightning: 43, holy: 55 }, guardBoost: 48 },
  { id: "fallingstar-beast-jaw", name: "Fallingstar Beast Jaw", negation: { magic: 55, fire: 43, lightning: 43, holy: 43 }, guardBoost: 48 },
  { id: "ghiza-s-wheel", name: "Ghiza's Wheel", negation: { magic: 43, fire: 43, lightning: 43, holy: 43 }, guardBoost: 48 },
  { id: "giant-crusher", name: "Giant-Crusher", negation: { magic: 52, fire: 52, lightning: 52, holy: 52 }, guardBoost: 48 },
  { id: "golem-s-halberd", name: "Golem's Halberd", negation: { magic: 45, fire: 45, lightning: 45, holy: 45 }, guardBoost: 48 },
  { id: "great-club", name: "Great Club", negation: { magic: 41, fire: 42, lightning: 40, holy: 47 }, guardBoost: 48 },
  { id: "prelate-s-inferno-crozier", name: "Prelate's Inferno Crozier", negation: { magic: 49, fire: 49, lightning: 49, holy: 49 }, guardBoost: 48 },
  { id: "raider-s-greataxe", name: "Raider's Greataxe", negation: { magic: 52, fire: 52, lightning: 52, holy: 52 }, guardBoost: 48 },
  { id: "rotten-greataxe", name: "Rotten Greataxe", negation: { magic: 47, fire: 47, lightning: 47, holy: 47 }, guardBoost: 48 },
  { id: "rotten-staff", name: "Rotten Staff", negation: { magic: 45, fire: 45, lightning: 45, holy: 45 }, guardBoost: 48 },
  { id: "staff-of-the-avatar", name: "Staff of the Avatar", negation: { magic: 45, fire: 45, lightning: 45, holy: 57 }, guardBoost: 52 },
  { id: "troll-s-hammer", name: "Troll's Hammer", negation: { magic: 41, fire: 46, lightning: 41, holy: 41 }, guardBoost: 48 },
  { id: "watchdog-s-staff", name: "Watchdog's Staff", negation: { magic: 45, fire: 45, lightning: 45, holy: 45 }, guardBoost: 48 },
];
