// ─────────────────────────────────────────────────────────────────────────
//  Party planning: a three-Nightfarer expedition assembled from builds.
//  Each slot holds a snapshot of a build (the same self-contained form a
//  build share link carries — build + the custom relics it uses), tagged
//  with who it came from. The draft party lives in localStorage; a party
//  travels as a URL hash (#p=<payload>), no server involved.
// ─────────────────────────────────────────────────────────────────────────

import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cloudRead } from "@/lib/cloudRead";
import {
  LIMITS,
  clampSharedBuild,
  clampText,
  compressJson,
  decompressJson,
  newId,
  packSharedBuild,
  parseForeignJson,
  unpackSharedBuild,
  type PackedBuild,
  type SharedBuild,
} from "@/lib/builds";

export interface PartyMember {
  /**
   * Synced account the build came from. The picker is cloud-only now, so
   * this is always set on new picks; null survives only in legacy parties
   * built from device-local builds.
   */
  uid: string | null;
  /** The owner's directory name, frozen at pick time. */
  ownerName: string;
  /**
   * The source build's id in its owner's store. Only an identity hint — the
   * snapshot is what the party renders — so the picker can mark which build
   * (and variant) a filled slot currently holds. Absent on older parties.
   */
  buildId?: string;
  /**
   * Which of the build's loadouts the snapshot is, by its tab label. Only set
   * when the source build actually has variants — a build with a single
   * loadout has nothing to disambiguate.
   */
  variantLabel?: string;
  /** Self-contained snapshot: the build plus the custom relics it uses. */
  build: SharedBuild;
}

export type PartySlots = [PartyMember | null, PartyMember | null, PartyMember | null];

export interface Party {
  /**
   * Cloud document id (parties/{id}), set once the party has been published.
   * Publishing again reuses it, so a shared link stays current with edits.
   * Absent for never-published drafts and parties loaded from someone
   * else's link (re-publishing those mints a fresh doc you own).
   */
  id?: string;
  name: string;
  /** Optional short description shown atop the party (MAX_BLURB chars). */
  blurb: string;
  /**
   * Whether the players fielded in the slots may edit their own slot — swap
   * in a different build of theirs without the owner doing it for them. The
   * owner keeps full control either way; this only ever grants, never takes.
   * On for parties created from here on; off for anything that predates the
   * setting, since nobody opted those in (see partyFromDoc).
   */
  slotEdits: boolean;
  slots: PartySlots;
}

/** Character cap for the party blurb. */
export const MAX_BLURB = 250;

export const EMPTY_PARTY: Party = {
  name: "",
  blurb: "",
  slotEdits: true,
  slots: [null, null, null],
};

const STORAGE_KEY = "nightreign-party";

/** Validate one slot's member of unknown provenance; null if unusable. */
export function normalizeMember(data: unknown): PartyMember | null {
  const m = data as PartyMember | null;
  if (!m || typeof m !== "object") return null;
  const b = m.build?.build;
  if (
    typeof m.ownerName !== "string" ||
    !b ||
    typeof b.character !== "string" ||
    !Array.isArray(b.slots) ||
    b.slots.length !== 3 ||
    !Array.isArray(b.deepSlots) ||
    b.deepSlots.length !== 3 ||
    !Array.isArray(m.build.relics)
  ) {
    return null;
  }
  // Everything below is somebody else's text arriving in this browser — a
  // slot's snapshot, and the name of whoever put it there — so it comes in
  // trimmed. clampSharedBuild leaves the shape alone; only lengths move.
  return {
    uid: typeof m.uid === "string" && m.uid ? m.uid : null,
    ownerName: clampText(m.ownerName, LIMITS.displayName),
    ...(typeof m.buildId === "string" && m.buildId
      ? { buildId: m.buildId.slice(0, 64) }
      : {}),
    ...(typeof m.variantLabel === "string" && m.variantLabel
      ? { variantLabel: m.variantLabel.slice(0, LIMITS.buildName) }
      : {}),
    build: clampSharedBuild(m.build),
  };
}

/** Validate a parsed party of unknown provenance; null if unusable. */
export function normalizeParty(data: unknown): Party | null {
  const d = data as { name?: unknown; slots?: unknown[] };
  if (!d || !Array.isArray(d.slots) || d.slots.length !== 3) return null;
  const slots = d.slots.map(normalizeMember) as PartySlots;
  const id = (d as { id?: unknown }).id;
  const blurb = (d as { blurb?: unknown }).blurb;
  return {
    ...(typeof id === "string" && id ? { id } : {}),
    name: typeof d.name === "string" ? d.name : "",
    blurb: typeof blurb === "string" ? blurb.slice(0, MAX_BLURB) : "",
    // Absent means "made before the setting existed", which for a draft or a
    // link is a party about to be published fresh — so it takes the default.
    // A published doc that predates the field is the one case that must not
    // (nobody opted it in); partyFromDoc overrides it there.
    slotEdits: (d as { slotEdits?: unknown }).slotEdits !== false,
    slots,
  };
}

/** Load the draft party from localStorage (call client-side only). */
export function loadParty(): Party {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PARTY;
    return normalizeParty(JSON.parse(raw)) ?? EMPTY_PARTY;
  } catch {
    return EMPTY_PARTY;
  }
}

/** Persist the draft party; false when the write failed (see saveStore). */
export function saveParty(party: Party): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(party));
    return true;
  } catch {
    return false;
  }
}

/**
 * [ownerName, uid ("" = none), packed build, variant label, build id] — 0
 * marks an empty slot. The last two were added later, so links minted before
 * them stop at the packed build and decode with those undefined.
 */
type PackedMember = 0 | [string, string, PackedBuild, string?, string?];

interface PartyPayload {
  v: 1;
  n: string;
  /** Blurb — absent on links minted before it existed. */
  d?: string;
  /** 0 = slot edits off. Absent on older links, which take the default. */
  e?: 0;
  m: PackedMember[];
}

/** Encode a party into a URL-safe string (the #p= hash payload). */
export async function encodeParty(party: Party): Promise<string> {
  const payload: PartyPayload = {
    v: 1,
    n: party.name,
    ...(party.blurb.trim() ? { d: party.blurb.trim() } : {}),
    ...(party.slotEdits ? {} : { e: 0 as const }),
    m: party.slots.map((s): PackedMember =>
      s
        ? [s.ownerName, s.uid ?? "", packSharedBuild(s.build), s.variantLabel ?? "", s.buildId ?? ""]
        : 0,
    ),
  };
  return compressJson(payload);
}

// ── Cloud copies ─────────────────────────────────────────────────────────
//  Published parties live in Firestore at parties/{id}. That makes a short
//  shareable link — /builds/party?id=<id> — instead of a hash carrying the
//  whole payload. Publishing requires being signed in; the hash link remains
//  the signed-out fallback.
//
//  The doc keeps one field per slot rather than the whole party as a single
//  JSON string, because security rules can't see inside a string: with
//  slot0/slot1/slot2 apart, a rule can say "this write touched only slot 1,
//  and slot 1 belongs to you" and let the player fielded there edit their own
//  slot without handing them the rest of the party. slotUids is that claim
//  list, duplicated out of the snapshots for the same reason — rules can read
//  a top-level array but not a uid buried in JSON. Two people editing
//  different slots don't collide: each write names only its own field.
//
//  `party` (the whole thing as one string) is still written for bundles
//  cached from before the split. Nothing current reads it when slot0 exists.

/** How many members a party fields. */
const SLOT_COUNT = 3;

const partyDoc = (id: string) => doc(db, "parties", id);

/** Doc field holding slot `i` — the granularity rules operate at. */
const slotField = (i: number) => `slot${i}`;

/** One slot's snapshot as stored: JSON, or "" for an open slot. */
const memberJson = (m: PartyMember | null) => (m ? JSON.stringify(m) : "");

/** Characters per slot, for browse cards that don't parse the snapshots. */
const rosterOf = (slots: PartySlots) => slots.map((s) => (s ? s.build.build.character : null));

/** Who may edit each slot: the account whose build fills it ("" = nobody). */
const slotUidsOf = (slots: PartySlots) => slots.map((s) => s?.uid ?? "");

/** A fetched cloud party plus who may write what. */
export interface CloudParty {
  party: Party;
  ownerUid: string | null;
  /**
   * Per slot, the account allowed to edit it ("" = nobody). Read from the
   * doc's own array rather than derived from the snapshots, because that
   * array is what the security rules check — a snapshot's inner uid is
   * inside a JSON string and could say anything.
   */
  slotUids: string[];
}

/** Read a party out of its doc, whichever shape the doc is in. */
function partyFromDoc(id: string, data: DocumentData | undefined): CloudParty | null {
  if (!data) return null;
  const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : null;

  if (typeof data.slot0 === "string") {
    const slots = Array.from({ length: SLOT_COUNT }, (_, i) => {
      const raw = data[slotField(i)];
      if (typeof raw !== "string" || !raw) return null;
      return normalizeMember(parseForeignJson(raw));
    }) as PartySlots;
    const uids = Array.isArray(data.slotUids) ? data.slotUids : [];
    return {
      party: {
        id,
        name: typeof data.name === "string" ? data.name : "",
        blurb: typeof data.blurb === "string" ? data.blurb.slice(0, MAX_BLURB) : "",
        slotEdits: data.slotEdits === true,
        slots,
      },
      ownerUid,
      slotUids: Array.from({ length: SLOT_COUNT }, (_, i) =>
        typeof uids[i] === "string" ? (uids[i] as string) : "",
      ),
    };
  }

  // Published before the split: the whole party in one string, and no claim
  // list — so no slot edits either, which is also the right default for a
  // party whose owner never saw the setting.
  if (typeof data.party !== "string") return null;
  const party = normalizeParty(parseForeignJson(data.party));
  if (!party) return null;
  return { party: { ...party, id, slotEdits: false }, ownerUid, slotUids: ["", "", ""] };
}

/** Create or update the party's cloud doc as its owner; returns its id. */
export async function publishParty(party: Party, ownerUid: string): Promise<string> {
  const id = party.id ?? newId();
  const stored = { ...party, id };
  await setDoc(partyDoc(id), {
    slot0: memberJson(party.slots[0]),
    slot1: memberJson(party.slots[1]),
    slot2: memberJson(party.slots[2]),
    slotUids: slotUidsOf(party.slots),
    slotEdits: party.slotEdits,
    // Only read by bundles cached from before the split; slot0..2 are the
    // copy that stays current, since a slot edit can't rewrite this one.
    party: JSON.stringify(stored),
    // name/blurb/roster sit outside the snapshots so the browse list can
    // render without parsing every doc.
    name: party.name.trim(),
    blurb: party.blurb.trim().slice(0, MAX_BLURB),
    roster: rosterOf(party.slots),
    ownerUid,
    updatedAt: serverTimestamp(),
  });
  return id;
}

/**
 * Write one slot as the player fielded in it — the whole point of splitting
 * the doc up. Touches that slot's field and its place in the roster, nothing
 * else; the rules reject anything wider (including a different slot, or
 * handing the slot to someone else).
 *
 * The roster is a single array field, so writing our index means sending the
 * other two back as well — hence the transaction: it re-reads immediately
 * before committing and retries on contention, so a slot someone else changed
 * meanwhile can't be reverted by our copy of the array.
 */
export async function updateSlot(id: string, index: number, member: PartyMember): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = partyDoc(id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("that party no longer exists");
    const current = snap.data().roster;
    const roster = Array.from({ length: SLOT_COUNT }, (_, i) =>
      Array.isArray(current) && typeof current[i] === "string" ? (current[i] as string) : null,
    );
    roster[index] = member.build.build.character;
    tx.update(ref, {
      [slotField(index)]: memberJson(member),
      roster,
      updatedAt: serverTimestamp(),
    });
  });
}

/** Remove a published party (its ?id= link stops working). */
export async function deleteParty(id: string): Promise<void> {
  await deleteDoc(partyDoc(id));
}

/**
 * Follow a published party while it's open, so a slot someone else is editing
 * lands in front of you instead of waiting for a reload. Our own writes are
 * skipped (hasPendingWrites) — the local state already has them.
 *
 * Returns the unsubscribe function; a listener failure is logged and ends the
 * subscription, leaving the fetch at open as the fallback.
 */
export function watchParty(id: string, onChange: (cp: CloudParty) => void): () => void {
  return onSnapshot(
    partyDoc(id),
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const cp = partyFromDoc(id, snap.data());
      if (cp) onChange(cp);
    },
    (err) => console.error("Watching the party failed:", err),
  );
}

/** Browse-list entry for a published party. */
export interface PartySummary {
  id: string;
  name: string;
  blurb: string;
  /** Character per slot; null = open slot. */
  roster: (string | null)[];
  ownerUid: string | null;
  /** Per slot, the account allowed to edit it ("" = nobody). */
  slotUids: string[];
  /** Whether those accounts may actually use that claim. */
  slotEdits: boolean;
  updatedAt: number | null;
}

/** Every published party, most recently updated first. */
export async function listParties(): Promise<PartySummary[]> {
  const snap = await cloudRead(() => getDocs(collection(db, "parties")));
  return snap.docs
    .map((d) => {
      const data = d.data() as {
        name?: unknown;
        blurb?: unknown;
        roster?: unknown[];
        ownerUid?: unknown;
        slotUids?: unknown[];
        slotEdits?: unknown;
        updatedAt?: unknown;
      };
      return {
        id: d.id,
        name: typeof data.name === "string" ? data.name : "",
        blurb: typeof data.blurb === "string" ? data.blurb : "",
        roster: Array.isArray(data.roster)
          ? data.roster.map((r) => (typeof r === "string" ? r : null))
          : [],
        ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : null,
        slotUids: Array.isArray(data.slotUids)
          ? data.slotUids.map((u) => (typeof u === "string" ? u : ""))
          : [],
        slotEdits: data.slotEdits === true,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : null,
      };
    })
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

/** Read a published party; null when absent or unparseable. */
export async function fetchParty(id: string): Promise<CloudParty | null> {
  const snap = await cloudRead(() => getDoc(partyDoc(id)));
  return partyFromDoc(id, snap.data());
}

/** Decode a party payload; null if it isn't one. */
export async function decodeParty(encoded: string): Promise<Party | null> {
  const d = (await decompressJson(encoded)) as PartyPayload | null;
  if (!d || typeof d !== "object" || d.v !== 1 || !Array.isArray(d.m) || d.m.length !== 3) {
    return null;
  }
  const slots = d.m.map((m): PartyMember | null => {
    if (!Array.isArray(m)) return null;
    const [ownerName, uid, packed, variantLabel, buildId] = m;
    if (typeof ownerName !== "string") return null;
    const build = unpackSharedBuild(packed as PackedBuild);
    if (!build) return null;
    return {
      uid: typeof uid === "string" && uid ? uid : null,
      ownerName,
      ...(typeof buildId === "string" && buildId ? { buildId } : {}),
      ...(typeof variantLabel === "string" && variantLabel ? { variantLabel } : {}),
      build,
    };
  }) as PartySlots;
  return {
    name: typeof d.n === "string" ? d.n : "",
    blurb: typeof d.d === "string" ? d.d.slice(0, MAX_BLURB) : "",
    slotEdits: d.e !== 0,
    slots,
  };
}
