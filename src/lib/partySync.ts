"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Keeping party slots current with the builds behind them.
//
//  A slot stores a *snapshot* (see party.ts) so a party keeps rendering with
//  no network and no owner cooperation. The snapshot is the fallback, not the
//  ceiling: whenever a party is opened — in the planner or read-only from a
//  share link — each slot that remembers where it came from (uid + buildId)
//  is re-read from its owner's live store and re-snapshotted. Upgrade a relic
//  in a build and every party fielding it shows the upgrade.
//
//  A build that has since been deleted, or hidden from its owner's profile,
//  can't be re-snapshotted: the slot is emptied and the reason surfaced, so
//  an open slot reads as "this went away" rather than "nobody picked yet".
//  Nothing here writes: the planner persists the refresh on the next Save,
//  and a read-only view simply shows the current truth over a stale doc.
// ─────────────────────────────────────────────────────────────────────────

import { pullCloudStore } from "@/lib/cloud";
import {
  EMPTY_STORE,
  LIMITS,
  clampText,
  toSharedBuild,
  variantCount,
  variantLabel,
  type Build,
  type BuildStore,
  type CustomRelic,
  type SharedBuild,
} from "@/lib/builds";
import type { Party, PartyMember, PartySlots } from "@/lib/party";

/** What happened to one slot when the party was checked against its builds. */
export interface SlotSyncNote {
  /**
   * updated  — the snapshot was refreshed from a build that has since changed.
   * deleted  — the build is gone from its owner's store; the slot was emptied.
   * unshared — the build still exists but no longer shows on its owner's
   *            profile, so it's no longer ours to display; slot emptied.
   */
  kind: "updated" | "deleted" | "unshared";
  ownerName: string;
  /** The build's name as the party last knew it ("Unnamed build" if blank). */
  buildName: string;
}

export type SlotSyncNotes = [SlotSyncNote | null, SlotSyncNote | null, SlotSyncNote | null];

export const NO_SYNC_NOTES: SlotSyncNotes = [null, null, null];

export interface PartySyncResult {
  /** The party with every resolvable slot re-snapshotted. */
  party: Party;
  notes: SlotSyncNotes;
  /** True when any slot actually moved — nothing to report otherwise. */
  changed: boolean;
}

/**
 * A snapshot's content, order-independent: two snapshots of the same loadout
 * compare equal even if the owner has since reordered their relic pool. Relic
 * fields are part of the key, so upgrading a relic in place (same id, new
 * effects) reads as a change — which is the main thing this is for.
 */
function snapshotKey(sb: SharedBuild): string {
  const b = sb.build;
  const relic = (r: CustomRelic) => [
    r.id,
    r.name,
    r.color,
    r.look ?? "",
    r.effects,
    r.demerits ?? [],
    r.deep ? 1 : 0,
  ];
  return JSON.stringify([
    b.name,
    b.character,
    b.chalice,
    b.slots,
    b.deepSlots,
    [...sb.relics].sort((x, y) => x.id.localeCompare(y.id)).map(relic),
  ]);
}

/**
 * Which loadout of `build` the slot is running now. A named variant is found
 * by its label; a label that no longer exists (renamed, or deleted down to
 * fewer loadouts) falls back to the build's own loadout rather than emptying
 * the slot — same bargain as a stale `&v=` link.
 */
function variantIndexFor(build: Build, label: string | undefined): number {
  if (!label) return 0;
  for (let i = 0; i < variantCount(build); i++) {
    if (variantLabel(build, i) === label) return i;
  }
  return 0;
}

/** Re-snapshot one member against its owner's store; null = build gone. */
function resync(
  member: PartyMember,
  store: BuildStore,
): { member: PartyMember; changed: boolean } | { member: null; kind: "deleted" | "unshared" } {
  const build = store.builds.find((b) => b.id === member.buildId);
  if (!build) return { member: null, kind: "deleted" };
  // Hidden builds are absent from the picker, so they're absent from a party
  // too — a slot may not outlive the visibility of what fills it.
  if (build.public === false) return { member: null, kind: "unshared" };

  const idx = variantIndexFor(build, member.variantLabel);
  // The label comes from the build's owner and is rendered in the slot
  // header, so it's clamped like the rest of the snapshot (toSharedBuild
  // handles everything below it).
  const rawLabel = variantCount(build) > 1 ? variantLabel(build, idx) : undefined;
  const label = rawLabel ? clampText(rawLabel, LIMITS.buildName) : undefined;
  const snapshot = toSharedBuild(build, store, idx);
  const fresh: PartyMember = {
    ...member,
    ...(label ? { variantLabel: label } : {}),
    build: snapshot,
  };
  if (!label) delete fresh.variantLabel;

  const changed =
    // No build before means this slot was reserved and has just been filled —
    // nothing to compare, everything to report.
    !member.build ||
    snapshotKey(snapshot) !== snapshotKey(member.build) ||
    fresh.variantLabel !== member.variantLabel;
  return { member: changed ? fresh : member, changed };
}

/**
 * Check a party's slots against the builds they were taken from, returning
 * the refreshed party and a note per slot that moved.
 *
 * Only slots that remember their source (a synced uid and buildId) can be
 * checked — legacy slots and those from device-local builds keep their
 * snapshot untouched. A store that fails to load is treated the same way: an
 * offline read must not empty a slot, so the snapshot stands.
 */
export async function refreshParty(party: Party): Promise<PartySyncResult> {
  const uids = Array.from(
    new Set(party.slots.flatMap((s) => (s?.uid && s.buildId ? [s.uid] : []))),
  );
  if (uids.length === 0) return { party, notes: NO_SYNC_NOTES, changed: false };

  // One read per owner, however many slots they field.
  const stores = new Map<string, BuildStore | null>();
  await Promise.all(
    uids.map(async (uid) => {
      try {
        stores.set(uid, await pullCloudStore(uid));
      } catch (err) {
        console.error("Checking a party member's builds failed:", err);
        stores.set(uid, null);
      }
    }),
  );

  const notes: SlotSyncNotes = [null, null, null];
  let changed = false;
  const slots = party.slots.map((member, i) => {
    if (!member?.uid || !member.buildId) return member;
    const store = stores.get(member.uid);
    // Undefined = the read failed (keep the snapshot). Null = the account has
    // no store at all, which is as gone as a deleted build.
    if (store === undefined) return member;
    const buildName = member.build?.build.name.trim() || "Unnamed build";
    const result = resync(member, store ?? EMPTY_STORE);
    if (!result.member) {
      notes[i] = { kind: result.kind, ownerName: member.ownerName, buildName };
      changed = true;
      return null;
    }
    if (result.changed) {
      notes[i] = { kind: "updated", ownerName: member.ownerName, buildName };
      changed = true;
    }
    return result.member;
  }) as PartySlots;

  return { party: changed ? { ...party, slots } : party, notes, changed };
}

/** One line of plain English for a slot note. */
export function syncNoteText(note: SlotSyncNote): string {
  const build = `“${note.buildName}”`;
  switch (note.kind) {
    case "updated":
      return `Updated to ${note.ownerName}’s current version of ${build}.`;
    case "unshared":
      return `${note.ownerName} stopped sharing ${build} — this slot is empty now.`;
    default:
      return `${note.ownerName} deleted ${build} — this slot is empty now.`;
  }
}
