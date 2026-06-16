// ─────────────────────────────────────────────────────────────────────────
//  Nightlords — the 8 expedition end-bosses, their weaknesses, defenses, and
//  Everdark Sovereign HP. Negative damage negation = a weakness (takes more).
//  Everdark versions share negations/resistances with normal; only HP differs.
// ─────────────────────────────────────────────────────────────────────────

export type WeaknessElement =
  | "holy"
  | "fire"
  | "lightning"
  | "magic"
  | "poison"
  | "madness"
  | "sleep"
  | "strike";

export type NegationKey = "standard" | "slash" | "strike" | "pierce" | "magic" | "fire" | "lightning" | "holy";
export type StatusKey = "poison" | "rot" | "bleed" | "frost" | "sleep" | "madness";

/** A status value: a number (buildup resistance), "Immune", or null (not listed). */
export type Resist = number | "Immune" | null;

/** A single phase of a multi-phase boss, with its own defenses. */
export interface NightlordPhase {
  label: string;
  /** Solo (·) HP for this phase. */
  hp: number | null;
  negations: Record<NegationKey, number>;
  resistances: Record<StatusKey, Resist>;
  note?: string;
}

export interface Nightlord {
  id: string;
  name: string;
  alias: string;
  weaknesses: WeaknessElement[];
  negations: Record<NegationKey, number>;
  resistances: Record<StatusKey, Resist>;
  /** Base (solo ·) HP. null = not documented. */
  hpNormal: number | null;
  hpEverdark: number | null;
  note: string;
  /** Multi-phase final bosses: per-phase defenses, shown stacked. */
  phases?: NightlordPhase[];
}

export const NEGATION_COLUMNS: { key: NegationKey; label: string }[] = [
  { key: "standard", label: "Std" },
  { key: "slash", label: "Slash" },
  { key: "strike", label: "Strike" },
  { key: "pierce", label: "Pierce" },
  { key: "magic", label: "Magic" },
  { key: "fire", label: "Fire" },
  { key: "lightning", label: "Lightning" },
  { key: "holy", label: "Holy" },
];

export const STATUS_COLUMNS: { key: StatusKey; label: string }[] = [
  { key: "poison", label: "Poison" },
  { key: "rot", label: "Rot" },
  { key: "bleed", label: "Bleed" },
  { key: "frost", label: "Frost" },
  { key: "sleep", label: "Sleep" },
  { key: "madness", label: "Madness" },
];

export const WEAKNESS: Record<WeaknessElement, { label: string; color: string; icon?: string }> = {
  holy: { label: "Holy", color: "#ecdf9a", icon: "/icons/elements/holy-affinity.png" },
  fire: { label: "Fire", color: "#e08a4a", icon: "/icons/elements/fire-affinity.png" },
  lightning: { label: "Lightning", color: "#e3c45a", icon: "/icons/elements/lightning-affinity.png" },
  magic: { label: "Magic", color: "#5aa0e0", icon: "/icons/elements/magic-affinity.png" },
  poison: { label: "Poison", color: "#8fbf3f" },
  madness: { label: "Madness", color: "#e0a838" },
  sleep: { label: "Sleep", color: "#8fb8e0" },
  strike: { label: "Strike", color: "#cbb890" },
};
