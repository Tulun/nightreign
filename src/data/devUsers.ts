// ─────────────────────────────────────────────────────────────────────────
//  FAKE CLOUD FIXTURES  ·  the accounts, stores and parties the dev shim
//  serves instead of Firestore (see lib/fakeCloud.ts).
// ─────────────────────────────────────────────────────────────────────────
//  Chosen to cover the states that are otherwise a chore to produce with a
//  real backend:
//    fake-you       the account you "sign in" as. Its cloud store is
//                   deliberately out of step with the ?seed=demo local one —
//                   a build only the cloud has, and a NEWER copy of a build
//                   the device also holds — so the sign-in merge in
//                   useCloudSync actually has to resolve something.
//    fake-vanguard  a well-stocked neighbour to browse and pick from.
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

const custom = (id: string): SlotTriple[number] => ({ kind: "custom", id });

function build(
  id: string,
  name: string,
  character: string,
  chalice: string,
  slots: SlotTriple,
  updatedAt: number,
): Build {
  return {
    id,
    name,
    character,
    chalice,
    slots,
    deepSlots: [null, null, null],
    notes: "",
    updatedAt,
  };
}

const store = (builds: Build[], customRelics: CustomRelic[], tags: string[] = []): BuildStore => ({
  version: 3,
  builds,
  customRelics,
  tags,
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
      build(
        "van-build-guardian",
        "Guardian — Wall",
        "Guardian",
        "Guardian's Chalice",
        [custom("van-relic-blue"), custom("van-relic-yellow"), null],
        now - 2 * DAY,
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
          blurb: "Two-tank opener, third slot open for whoever shows up.",
          slots: [
            member("fake-vanguard", "Vanguard", vanguard, "van-build-guardian"),
            member("fake-solo", "SoloRunner", solo, "solo-build-wylder"),
            null,
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
          slots: [member(SELF_UID, "Nightfarer-fake", you, "cloud-build-ironeye"), null, null],
        },
      },
    ],
  };
}
