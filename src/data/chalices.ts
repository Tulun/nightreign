import type { CharacterChalices, Chalice } from "@/lib/chalices";

// ─────────────────────────────────────────────────────────────────────────
//  CHALICES (VESSELS)  ·  per-Nightfarer, in game order
// ─────────────────────────────────────────────────────────────────────────
//  Slot colors from the Fextralife Vessels table (cross-checked against the
//  per-character pages), including each vessel's Deep of Night slot layout —
//  several vessels change slots there. White is the universal slot.

export const CHALICE_CREDIT = "Vessel data from the Fextralife Nightreign wiki";

const BAZAAR = "Small Jar Bazaar · 1,200 Murk";
const SIGNBOARD = "Collector Signboard · 4 Sovereign Sigils";
const STARTING = "Starting chalice";

export const characterChalices: CharacterChalices[] = [
  { name: "Wylder", chalices: [
    { name: "Wylder's Urn", slots: ["Red", "Red", "Blue"], deep: ["Red", "Red", "Blue"], source: STARTING },
    { name: "Wylder's Goblet", slots: ["Yellow", "Green", "Green"], deep: ["Yellow", "Green", "Green"], source: BAZAAR },
    { name: "Wylder's Chalice", slots: ["Red", "Yellow", "White"], deep: ["Red", "Green", "Blue"], source: "Wylder Remembrance quest reward" },
    { name: "Soot-Covered Wylder's Urn", slots: ["Blue", "Blue", "Yellow"], deep: ["Blue", "Blue", "Yellow"], source: SIGNBOARD },
    { name: "Sealed Wylder's Urn", slots: ["Blue", "Red", "Red"], deep: ["Green", "Yellow", "Yellow"], source: SIGNBOARD },
    { name: "Decrepit Wylder's Goblet", slots: ["Blue", "Green", "Yellow"], deep: ["Blue", "Green", "Yellow"], source: SIGNBOARD },
    { name: "Forgotten Wylder's Goblet", slots: ["Green", "Green", "Yellow"], deep: ["Red", "Green", "White"], source: SIGNBOARD },
  ] },
  { name: "Guardian", chalices: [
    { name: "Guardian's Urn", slots: ["Red", "Yellow", "Yellow"], deep: ["Red", "Yellow", "Yellow"], source: STARTING },
    { name: "Guardian's Goblet", slots: ["Blue", "Blue", "Green"], deep: ["Blue", "Blue", "Green"], source: BAZAAR },
    { name: "Guardian's Chalice", slots: ["Blue", "Yellow", "White"], deep: ["Yellow", "Yellow", "Green"], source: "Guardian Remembrance quest reward" },
    { name: "Soot-Covered Guardian's Urn", slots: ["Red", "Green", "Green"], deep: ["Red", "Green", "Green"], source: SIGNBOARD },
    { name: "Sealed Guardian's Urn", slots: ["Yellow", "Yellow", "Red"], deep: ["Green", "Green", "Blue"], source: SIGNBOARD },
    { name: "Decrepit Guardian's Goblet", slots: ["Yellow", "Green", "Green"], deep: ["Yellow", "Green", "Green"], source: SIGNBOARD },
    { name: "Forgotten Guardian's Goblet", slots: ["Green", "Blue", "Blue"], deep: ["Red", "Blue", "White"], source: SIGNBOARD },
  ] },
  { name: "Ironeye", chalices: [
    { name: "Ironeye's Urn", slots: ["Yellow", "Green", "Green"], deep: ["Yellow", "Green", "Green"], source: STARTING },
    { name: "Ironeye's Goblet", slots: ["Red", "Blue", "Yellow"], deep: ["Red", "Blue", "Yellow"], source: BAZAAR },
    { name: "Ironeye's Chalice", slots: ["Red", "Green", "White"], deep: ["Red", "Red", "Green"], source: "Ironeye Remembrance quest reward" },
    { name: "Soot-Covered Ironeye's Urn", slots: ["Blue", "Yellow", "Yellow"], deep: ["Blue", "Yellow", "Yellow"], source: SIGNBOARD },
    { name: "Sealed Ironeye's Urn", slots: ["Green", "Green", "Yellow"], deep: ["Blue", "Blue", "Red"], source: SIGNBOARD },
    { name: "Decrepit Ironeye's Goblet", slots: ["Blue", "Blue", "Green"], deep: ["Blue", "Blue", "Green"], source: SIGNBOARD },
    { name: "Forgotten Ironeye's Goblet", slots: ["Yellow", "Blue", "Red"], deep: ["Yellow", "Green", "White"], source: SIGNBOARD },
  ] },
  { name: "Duchess", chalices: [
    { name: "Duchess' Urn", slots: ["Red", "Blue", "Blue"], deep: ["Red", "Blue", "Blue"], source: STARTING },
    { name: "Duchess' Goblet", slots: ["Yellow", "Yellow", "Green"], deep: ["Yellow", "Yellow", "Green"], source: BAZAAR },
    { name: "Duchess' Chalice", slots: ["Blue", "Yellow", "White"], deep: ["Red", "Blue", "Yellow"], source: "Duchess Remembrance quest reward (part 2)" },
    { name: "Soot-Covered Duchess' Urn", slots: ["Red", "Red", "Green"], deep: ["Red", "Red", "Green"], source: SIGNBOARD },
    { name: "Sealed Duchess' Urn", slots: ["Blue", "Blue", "Red"], deep: ["Green", "Green", "Yellow"], source: SIGNBOARD },
    { name: "Decrepit Duchess' Goblet", slots: ["Blue", "Green", "Green"], deep: ["Blue", "Green", "Green"], source: SIGNBOARD },
    { name: "Forgotten Duchess' Goblet", slots: ["Green", "Yellow", "Yellow"], deep: ["Red", "Green", "White"], source: SIGNBOARD },
  ] },
  { name: "Raider", chalices: [
    { name: "Raider's Urn", slots: ["Red", "Green", "Green"], deep: ["Red", "Green", "Green"], source: STARTING },
    { name: "Raider's Goblet", slots: ["Red", "Blue", "Yellow"], deep: ["Red", "Blue", "Yellow"], source: BAZAAR },
    { name: "Raider's Chalice", slots: ["Red", "Red", "White"], deep: ["Red", "Yellow", "Yellow"], source: "Raider Remembrance quest reward (part 2)" },
    { name: "Soot-Covered Raider's Urn", slots: ["Blue", "Blue", "Green"], deep: ["Blue", "Blue", "Green"], source: SIGNBOARD },
    { name: "Sealed Raider's Urn", slots: ["Green", "Green", "Red"], deep: ["Yellow", "Blue", "Blue"], source: SIGNBOARD },
    { name: "Decrepit Raider's Goblet", slots: ["Yellow", "Yellow", "Green"], deep: ["Yellow", "Yellow", "Green"], source: SIGNBOARD },
    { name: "Forgotten Raider's Goblet", slots: ["Yellow", "Blue", "Red"], deep: ["Red", "Green", "White"], source: SIGNBOARD },
  ] },
  { name: "Revenant", chalices: [
    { name: "Revenant's Urn", slots: ["Blue", "Blue", "Yellow"], deep: ["Blue", "Blue", "Yellow"], source: STARTING },
    { name: "Revenant's Goblet", slots: ["Red", "Red", "Green"], deep: ["Red", "Red", "Green"], source: BAZAAR },
    { name: "Revenant's Chalice", slots: ["Blue", "Green", "White"], deep: ["Blue", "Yellow", "Green"], source: "Revenant Remembrance quest reward (part 2)" },
    { name: "Soot-Covered Revenant's Urn", slots: ["Red", "Yellow", "Yellow"], deep: ["Red", "Yellow", "Yellow"], source: SIGNBOARD },
    { name: "Sealed Revenant's Urn", slots: ["Yellow", "Blue", "Blue"], deep: ["Green", "Green", "Red"], source: SIGNBOARD },
    { name: "Decrepit Revenant's Goblet", slots: ["Red", "Red", "Yellow"], deep: ["Red", "Red", "Yellow"], source: SIGNBOARD },
    { name: "Forgotten Revenant's Goblet", slots: ["Green", "Red", "Red"], deep: ["Yellow", "Green", "White"], source: SIGNBOARD },
  ] },
  { name: "Recluse", chalices: [
    { name: "Recluse's Urn", slots: ["Blue", "Blue", "Green"], deep: ["Blue", "Blue", "Green"], source: STARTING },
    { name: "Recluse's Goblet", slots: ["Red", "Blue", "Yellow"], deep: ["Red", "Blue", "Yellow"], source: BAZAAR },
    { name: "Recluse's Chalice", slots: ["Yellow", "Green", "White"], deep: ["Blue", "Green", "Green"], source: "Recluse Remembrance quest reward (part 1)" },
    { name: "Soot-Covered Recluse's Urn", slots: ["Red", "Red", "Yellow"], deep: ["Red", "Red", "Yellow"], source: SIGNBOARD },
    { name: "Sealed Recluse's Urn", slots: ["Green", "Blue", "Blue"], deep: ["Yellow", "Yellow", "Red"], source: SIGNBOARD },
    { name: "Decrepit Recluse's Goblet", slots: ["Yellow", "Yellow", "Blue"], deep: ["Yellow", "Yellow", "Blue"], source: SIGNBOARD },
    { name: "Forgotten Recluse's Goblet", slots: ["Yellow", "Blue", "Red"], deep: ["Blue", "Green", "White"], source: SIGNBOARD },
  ] },
  { name: "Executor", chalices: [
    { name: "Executor's Urn", slots: ["Red", "Yellow", "Yellow"], deep: ["Red", "Yellow", "Yellow"], source: STARTING },
    { name: "Executor's Goblet", slots: ["Red", "Blue", "Green"], deep: ["Red", "Blue", "Green"], source: BAZAAR },
    { name: "Executor's Chalice", slots: ["Blue", "Yellow", "White"], deep: ["Yellow", "Yellow", "Green"], source: "Executor Remembrance quest reward (part 1)" },
    { name: "Soot-Covered Executor's Urn", slots: ["Red", "Red", "Blue"], deep: ["Red", "Red", "Blue"], source: SIGNBOARD },
    { name: "Sealed Executor's Urn", slots: ["Yellow", "Yellow", "Red"], deep: ["Green", "Green", "Blue"], source: SIGNBOARD },
    { name: "Decrepit Executor's Goblet", slots: ["Red", "Red", "Yellow"], deep: ["Red", "Red", "Yellow"], source: SIGNBOARD },
    { name: "Forgotten Executor's Goblet", slots: ["Green", "Blue", "Red"], deep: ["Yellow", "Green", "White"], source: SIGNBOARD },
  ] },
  { name: "Scholar", chalices: [
    { name: "Scholar's Urn", slots: ["Red", "Red", "Yellow"], deep: ["Red", "Red", "Yellow"], source: STARTING },
    { name: "Scholar's Goblet", slots: ["Blue", "Green", "Yellow"], deep: ["Blue", "Green", "Yellow"], source: BAZAAR },
    { name: "Scholar's Chalice", slots: ["Red", "Blue", "White"], deep: ["Red", "Yellow", "Yellow"], source: "Scholar Remembrance quest reward (chapter 3)" },
    { name: "Soot-Covered Scholar's Urn", slots: ["Blue", "Green", "Green"], deep: ["Blue", "Green", "Green"], source: SIGNBOARD },
    { name: "Sealed Scholar's Urn", slots: ["Yellow", "Red", "Red"], deep: ["Green", "Blue", "Blue"], source: SIGNBOARD },
    { name: "Decrepit Scholar's Goblet", slots: ["Blue", "Blue", "Green"], deep: ["Blue", "Blue", "Green"], source: SIGNBOARD },
    { name: "Forgotten Scholar's Goblet", slots: ["Yellow", "Green", "Blue"], deep: ["Yellow", "Green", "Green"], source: SIGNBOARD },
  ] },
  { name: "Undertaker", chalices: [
    { name: "Undertaker's Urn", slots: ["Blue", "Green", "Green"], deep: ["Blue", "Green", "Green"], source: STARTING },
    { name: "Undertaker's Goblet", slots: ["Red", "Yellow", "Yellow"], deep: ["Red", "Yellow", "Yellow"], source: BAZAAR },
    { name: "Undertaker's Chalice", slots: ["Green", "Yellow", "White"], deep: ["Blue", "Green", "Yellow"], source: "Undertaker Remembrance quest reward (chapter 5)" },
    { name: "Soot-Covered Undertaker's Urn", slots: ["Red", "Red", "Blue"], deep: ["Red", "Red", "Blue"], source: SIGNBOARD },
    { name: "Sealed Undertaker's Urn", slots: ["Green", "Green", "Blue"], deep: ["Yellow", "Red", "Red"], source: SIGNBOARD },
    { name: "Decrepit Undertaker's Goblet", slots: ["Red", "Blue", "Blue"], deep: ["Red", "Blue", "Blue"], source: SIGNBOARD },
    { name: "Forgotten Undertaker's Goblet", slots: ["Yellow", "Yellow", "Red"], deep: ["Blue", "Yellow", "Green"], source: SIGNBOARD },
  ] },
];

/** Grail chalices usable by every Nightfarer. */
export const grailChalices: Chalice[] = [
  { name: "Scadutree Grail", slots: ["Red", "Red", "Red"], deep: ["Red", "Red", "Red"], source: "Small Jar Bazaar · 3,000 Murk" },
  { name: "Giant's Cradle Grail", slots: ["Blue", "Blue", "Blue"], deep: ["Blue", "Blue", "Blue"], source: "Small Jar Bazaar · 3,000 Murk, after defeating 7 Nightlords" },
  { name: "Spirit Shelter Grail", slots: ["Green", "Green", "Green"], deep: ["Green", "Green", "Green"], source: "Small Jar Bazaar · 3,000 Murk" },
  { name: "Sacred Erdtree Grail", slots: ["Yellow", "Yellow", "Yellow"], deep: ["Yellow", "Yellow", "Yellow"], source: "Small Jar Bazaar · 3,000 Murk" },
];
