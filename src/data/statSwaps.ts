import type { CharacterSwaps, SwapStats } from "@/lib/statSwaps";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  RELIC STAT SWAPS  ·  per-Nightfarer
 * ─────────────────────────────────────────────────────────────────────────
 *  Statlines from the community table; HP/FP/Stamina totals include the normal
 *  relic's bonus stats. The bracketed deltas in the UI are the change from each
 *  character's Default line.
 */

export const SWAP_CREDIT = "Stat tables from r/Nightreign";
export const SWAP_NOTE =
  "Totals include the normal relic's bonus stats. Brackets show the change from Default.";

// stat order: hp, fp, stm, str, dex, int, fai, arc
const s = (
  hp: number, fp: number, stm: number, str: number,
  dex: number, int: number, fai: number, arc: number,
): SwapStats => ({ hp, fp, stm, str, dex, int, fai, arc });

export const characterSwaps: CharacterSwaps[] = [
  { name: "Wylder", base: s(1120, 140, 102, 50, 40, 15, 15, 10), swaps: [
    { label: "FP Up", stats: s(1080, 205, 102, 50, 40, 15, 15, 10) },
    { label: "INT/FTH Up", stats: s(1120, 140, 102, 43, 35, 33, 33, 10) },
  ] },
  { name: "Guardian", base: s(1280, 115, 124, 41, 31, 10, 21, 10), swaps: [
    { label: "STR/DEX Up", stats: s(1120, 115, 124, 53, 53, 10, 21, 10) },
    { label: "FP/FTH Up", stats: s(1160, 170, 124, 41, 31, 10, 41, 10) },
  ] },
  { name: "Ironeye", base: s(820, 115, 104, 19, 57, 7, 13, 13), swaps: [
    { label: "ARC Up", stats: s(820, 115, 104, 19, 51, 7, 13, 31) },
    { label: "HP/STR Up", stats: s(980, 115, 104, 42, 44, 7, 13, 13) },
  ] },
  { name: "Duchess", base: s(860, 180, 84, 11, 45, 42, 27, 11), swaps: [
    { label: "HP/STR Up", stats: s(980, 110, 84, 38, 45, 42, 27, 11) },
    { label: "FP/FTH Up", stats: s(860, 210, 84, 11, 45, 37, 43, 11) },
  ] },
  { name: "Raider", base: s(1200, 95, 122, 68, 19, 3, 12, 10), swaps: [
    { label: "FP/INT Up", stats: s(1040, 155, 114, 68, 19, 41, 12, 10) },
    { label: "ARC Up", stats: s(1180, 95, 122, 68, 19, 3, 12, 30) },
  ] },
  { name: "Revenant", base: s(760, 200, 82, 21, 21, 30, 51, 12), swaps: [
    { label: "HP/STM Up", stats: s(920, 145, 98, 21, 21, 30, 51, 12) },
    { label: "STR Up", stats: s(760, 200, 82, 49, 21, 30, 48, 12) },
  ] },
  { name: "Recluse", base: s(740, 195, 94, 12, 19, 51, 51, 10), swaps: [
    { label: "HP/STM/DEX Up", stats: s(880, 195, 110, 12, 39, 41, 41, 10) },
    { label: "INT/FTH Up", stats: s(740, 140, 94, 12, 19, 66, 66, 10) },
  ] },
  { name: "Executor", base: s(1000, 100, 102, 25, 63, 8, 6, 28), swaps: [
    { label: "HP/STM Up", stats: s(1160, 100, 120, 25, 63, 8, 6, 15) },
    { label: "DEX/ARC Up", stats: s(860, 100, 102, 25, 78, 8, 6, 40) },
  ] },
  { name: "Scholar", base: s(900, 145, 98, 14, 18, 28, 15, 50), swaps: [
    { label: "FP Up", stats: s(900, 205, 98, 14, 18, 28, 15, 50) },
    { label: "STM/DEX Up", stats: s(900, 145, 116, 14, 61, 24, 15, 30) },
  ] },
  { name: "Undertaker", base: s(1040, 115, 92, 50, 13, 5, 41, 10), swaps: [
    { label: "DEX Up", stats: s(1000, 115, 92, 50, 35, 5, 28, 10) },
    { label: "FP/FTH Up", stats: s(1040, 175, 92, 35, 13, 5, 56, 10) },
  ] },
];
