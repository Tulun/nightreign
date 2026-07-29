// ─────────────────────────────────────────────────────────────────────────
//  FAKE CLOUD FIXTURES  ·  the accounts, stores and parties the dev shim
//  serves instead of Firestore (see lib/fakeCloud.ts).
// ─────────────────────────────────────────────────────────────────────────
//  Chosen to cover the states that are otherwise a chore to produce with a
//  real backend:
//    fake-you       the account you "sign in" as, and the one ?seed= writes
//                   its fixture over. Its own store holds a build the demo
//                   seed doesn't, plus a NEWER copy of one it does, so a
//                   remoteEdit() against it gives useAccountStore's live
//                   merge something to actually resolve.
//    fake-vanguard  a well-stocked neighbour to browse and pick from. Its
//                   Guardian build is the one that runs Deep of Night
//                   relics, curses and all — the rest of the stub data is
//                   normal-set only, so anything Deep goes through it.
//    fake-solo      a one-build account.
//    fake-quiet     signed up, never synced: no store, updatedAt null.
//    fake-broken    reads of this account's store always time out, so the
//                   per-user CloudReadError path shows up inside an
//                   otherwise healthy directory.
// ─────────────────────────────────────────────────────────────────────────

import type { Build, BuildStore, CustomRelic, SharedBuild, SlotTriple } from "@/lib/builds";
import type { Party, PartyMember } from "@/lib/party";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** uid whose store read always fails — see fakeCloud's read guard. */
export const BROKEN_UID = "fake-broken";

/** uid the fake sign-in signs you in as. */
export const SELF_UID = "fake-you";

const relic = (
  id: string,
  color: CustomRelic["color"],
  name: string,
  effects: string[],
): CustomRelic => ({ id, name, color, effects, demerits: effects.map(() => ""), deep: false });

/**
 * A Deep of Night relic, written as [effect, curse] pairs — its lines can
 * carry a demerit under them, which is what the two slot sets are drawn to
 * different pitches for. "" leaves a line clean, as the game does.
 */
const deepRelic = (
  id: string,
  color: CustomRelic["color"],
  name: string,
  lines: [string, string][],
): CustomRelic => ({
  id,
  name,
  color,
  effects: lines.map(([effect]) => effect),
  demerits: lines.map(([, curse]) => curse),
  deep: true,
});

const custom = (id: string): SlotTriple[number] => ({ kind: "custom", id });

function build(
  id: string,
  name: string,
  character: string,
  chalice: string,
  slots: SlotTriple,
  updatedAt: number,
  /** Deep of Night slots — most fixtures run the normal set only. */
  deepSlots: SlotTriple = [null, null, null],
): Build {
  return {
    id,
    name,
    character,
    chalice,
    slots,
    deepSlots,
    notes: "",
    updatedAt,
  };
}

const store = (builds: Build[], customRelics: CustomRelic[], tags: string[] = []): BuildStore => ({
  version: 3,
  builds,
  customRelics,
  tags,
  relicTags: [],
  deleted: {},
});

/** A build packaged the way a party slot holds it: build + the relics it uses. */
function snapshot(src: BuildStore, buildId: string): SharedBuild {
  const b = src.builds.find((x) => x.id === buildId)!;
  const ids = new Set(
    [...b.slots, ...b.deepSlots].flatMap((s) => (s?.kind === "custom" ? [s.id] : [])),
  );
  const { id: _id, updatedAt: _updatedAt, ...rest } = b;
  return { build: rest, relics: src.customRelics.filter((r) => ids.has(r.id)) };
}

const member = (uid: string, ownerName: string, src: BuildStore, buildId: string): PartyMember => ({
  uid,
  ownerName,
  buildId,
  build: snapshot(src, buildId),
});

/** A slot handed to a player with no build in it — theirs to fill. */
const reserved = (uid: string, ownerName: string): PartyMember => ({ uid, ownerName });

export interface FakeProfile {
  uid: string;
  displayName: string | null;
  /** null = signed up but never synced. */
  updatedAt: number | null;
  store: BuildStore | null;
}

export interface FakeFixtures {
  profiles: FakeProfile[];
  parties: { id: string; ownerUid: string; party: Party; updatedAt: number }[];
}

export function fakeFixtures(now: number): FakeFixtures {
  const you = store(
    [
      // Only the cloud has this one — the merge must bring it down.
      build(
        "cloud-build-ironeye",
        "Ironeye — Marksman (cloud only)",
        "Ironeye",
        "Soot-Covered Ironeye's Urn", // Blue / Yellow / Yellow
        [custom("you-relic-blue"), null, null],
        now - 4 * HOUR,
      ),
      // Same id as a ?seed=demo build, but newer and renamed — the cloud
      // copy should win the merge and the card should change name.
      build(
        "seed-build-duchess",
        "Duchess — Restage (edited on another device)",
        "Duchess",
        "Duchess' Chalice",
        [custom("you-relic-blue"), null, null],
        now - 1 * HOUR,
      ),
    ],
    [relic("you-relic-blue", "Blue", "Farsight", ["Magic Attack Power Up +1", "Mind +2"])],
    ["synced"],
  );

  const vanguard = store(
    [
      // The one fixture that runs a Deep of Night set, so the party view's
      // Normal / Deep toggle and the build card's two-column pairing have
      // something to show. Guardian's Chalice goes Red / Blue / Yellow in
      // Deep, and the third slot stays open the way the normal set's does.
      build(
        "van-build-guardian",
        "Guardian — Wall",
        "Guardian",
        "Guardian's Chalice",
        [custom("van-relic-blue"), custom("van-relic-yellow"), null],
        now - 2 * DAY,
        [custom("van-deep-red"), custom("van-deep-blue"), null],
      ),
      build(
        "van-build-raider",
        "Raider — Big Swings",
        "Raider",
        "Raider's Urn",
        [custom("van-relic-red"), null, null],
        now - 3 * DAY,
      ),
      build(
        "van-build-revenant",
        "Revenant — Summons",
        "Revenant",
        "Revenant's Urn",
        [null, null, null],
        now - 11 * DAY,
      ),
    ],
    [
      relic("van-relic-red", "Red", "Ashen Grip", [
        "Physical Attack Up +2",
        "Improved Guard Counters",
      ]),
      relic("van-relic-blue", "Blue", "Tidecaller", ["Magic Attack Power Up +2", "Mind +3"]),
      relic("van-relic-yellow", "Yellow", "Sunlit Charm", [
        "Holy Attack Power Up +1",
        "Poise +2",
      ]),
      // A curse on one line and a clean line beside it, each way round.
      deepRelic("van-deep-red", "Red", "Sundered Bulwark", [
        ["Improved Physical Damage Negation +2", "Taking Damage Causes Blood Loss Buildup"],
        ["Improved Damage Negation at Low HP", ""],
      ]),
      deepRelic("van-deep-blue", "Blue", "Drowned Sigil", [
        ["Magic Attack Power Up +3", ""],
        ["Poise +3", "Reduced Rune Acquisition"],
      ]),
    ],
    ["meta", "co-op"],
  );

  const solo = store(
    [
      build(
        "solo-build-wylder",
        "Wylder — Solo Everdark",
        "Wylder",
        "Wylder's Urn",
        [custom("solo-relic-red"), null, null],
        now - 5 * HOUR,
      ),
    ],
    [relic("solo-relic-red", "Red", "Lone Ember", ["Physical Attack Up +1", "Vigor +3"])],
  );

  return {
    profiles: [
      { uid: SELF_UID, displayName: "Nightfarer-fake", updatedAt: now - 1 * HOUR, store: you },
      { uid: "fake-vanguard", displayName: "Vanguard", updatedAt: now - 2 * DAY, store: vanguard },
      { uid: "fake-solo", displayName: "SoloRunner", updatedAt: now - 5 * HOUR, store: solo },
      { uid: "fake-quiet", displayName: "QuietOne", updatedAt: null, store: null },
      { uid: BROKEN_UID, displayName: "BrokenSync", updatedAt: now - 9 * DAY, store: solo },
    ],
    parties: [
      {
        id: "fake-party-1",
        ownerUid: "fake-vanguard",
        updatedAt: now - 2 * DAY,
        party: {
          id: "fake-party-1",
          name: "Tricephalos Farm",
          blurb: "Two-tank opener; slot 3 is the fake sign-in's to edit.",
          // Somebody else's party with the signed-in account fielded in it,
          // which is the whole case slot edits exist for: Vanguard owns this,
          // and slot 3 is editable by fake-you and nobody else.
          slotEdits: true,
          slots: [
            member("fake-vanguard", "Vanguard", vanguard, "van-build-guardian"),
            member("fake-solo", "SoloRunner", solo, "solo-build-wylder"),
            member(SELF_UID, "Nightfarer-fake", you, "seed-build-duchess"),
          ],
        },
      },
      {
        id: "fake-party-2",
        ownerUid: SELF_UID,
        updatedAt: now - 3 * HOUR,
        party: {
          id: "fake-party-2",
          name: "My Published Party",
          blurb: "Owned by the fake sign-in, so Delete and re-publish are live.",
          slotEdits: true,
          // Slot 2 is the owner's side of a reservation: somebody's in it,
          // waiting on their own build. Slot 3 is plain empty, for contrast.
          slots: [
            member(SELF_UID, "Nightfarer-fake", you, "cloud-build-ironeye"),
            reserved("fake-vanguard", "Vanguard"),
            null,
          ],
        },
      },
    ],
  };
}
