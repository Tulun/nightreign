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
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  compressJson,
  decompressJson,
  newId,
  packSharedBuild,
  unpackSharedBuild,
  type PackedBuild,
  type SharedBuild,
} from "@/lib/builds";

export interface PartyMember {
  /** Synced account the build came from; null for a build off this device. */
  uid: string | null;
  /** The owner's directory name, frozen at pick time. */
  ownerName: string;
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
  slots: PartySlots;
}

/** Character cap for the party blurb. */
export const MAX_BLURB = 250;

export const EMPTY_PARTY: Party = { name: "", blurb: "", slots: [null, null, null] };

const STORAGE_KEY = "nightreign-party";

/** Validate a parsed party of unknown provenance; null if unusable. */
export function normalizeParty(data: unknown): Party | null {
  const d = data as { name?: unknown; slots?: unknown[] };
  if (!d || !Array.isArray(d.slots) || d.slots.length !== 3) return null;
  const slots = d.slots.map((s) => {
    const m = s as PartyMember | null;
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
    return {
      uid: typeof m.uid === "string" && m.uid ? m.uid : null,
      ownerName: m.ownerName,
      build: m.build,
    };
  }) as PartySlots;
  const id = (d as { id?: unknown }).id;
  const blurb = (d as { blurb?: unknown }).blurb;
  return {
    ...(typeof id === "string" && id ? { id } : {}),
    name: typeof d.name === "string" ? d.name : "",
    blurb: typeof blurb === "string" ? blurb.slice(0, MAX_BLURB) : "",
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

/** [ownerName, uid ("" = none), packed build] — 0 marks an empty slot. */
type PackedMember = 0 | [string, string, PackedBuild];

interface PartyPayload {
  v: 1;
  n: string;
  /** Blurb — absent on links minted before it existed. */
  d?: string;
  m: PackedMember[];
}

/** Encode a party into a URL-safe string (the #p= hash payload). */
export async function encodeParty(party: Party): Promise<string> {
  const payload: PartyPayload = {
    v: 1,
    n: party.name,
    ...(party.blurb.trim() ? { d: party.blurb.trim() } : {}),
    m: party.slots.map((s): PackedMember =>
      s ? [s.ownerName, s.uid ?? "", packSharedBuild(s.build)] : 0,
    ),
  };
  return compressJson(payload);
}

// ── Cloud copies ─────────────────────────────────────────────────────────
//  Published parties live in Firestore at parties/{id}, the party as a JSON
//  string (same reasoning as the build store in cloudSync.ts). That makes a
//  short shareable link — /builds/party?id=<id> — instead of a hash that
//  carries the whole payload. Publishing requires being signed in; the hash
//  link remains the signed-out fallback.

/** A fetched cloud party plus its owner (for deciding who may update it). */
export interface CloudParty {
  party: Party;
  ownerUid: string | null;
}

/** Create or update the party's cloud doc; returns its id. */
export async function publishParty(party: Party, ownerUid: string): Promise<string> {
  const id = party.id ?? newId();
  await setDoc(doc(db, "parties", id), {
    party: JSON.stringify({ ...party, id }),
    // name/blurb/roster are duplicated outside the JSON so the browse list
    // can render without parsing every doc.
    name: party.name.trim(),
    blurb: party.blurb.trim().slice(0, MAX_BLURB),
    roster: party.slots.map((s) => (s ? s.build.build.character : null)),
    ownerUid,
    updatedAt: serverTimestamp(),
  });
  return id;
}

/** Remove a published party (its ?id= link stops working). */
export async function deleteParty(id: string): Promise<void> {
  await deleteDoc(doc(db, "parties", id));
}

/** Browse-list entry for a published party. */
export interface PartySummary {
  id: string;
  name: string;
  blurb: string;
  /** Character per slot; null = open slot. */
  roster: (string | null)[];
  ownerUid: string | null;
  updatedAt: number | null;
}

/** Every published party, most recently updated first. */
export async function listParties(): Promise<PartySummary[]> {
  const snap = await getDocs(collection(db, "parties"));
  return snap.docs
    .map((d) => {
      const data = d.data() as {
        name?: unknown;
        blurb?: unknown;
        roster?: unknown[];
        ownerUid?: unknown;
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
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : null,
      };
    })
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

/** Read a published party; null when absent or unparseable. */
export async function fetchParty(id: string): Promise<CloudParty | null> {
  const snap = await getDoc(doc(db, "parties", id));
  const data = snap.data();
  if (!data || typeof data.party !== "string") return null;
  try {
    const party = normalizeParty(JSON.parse(data.party));
    if (!party) return null;
    return {
      party: { ...party, id },
      ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : null,
    };
  } catch {
    return null;
  }
}

/** Decode a party payload; null if it isn't one. */
export async function decodeParty(encoded: string): Promise<Party | null> {
  const d = (await decompressJson(encoded)) as PartyPayload | null;
  if (!d || typeof d !== "object" || d.v !== 1 || !Array.isArray(d.m) || d.m.length !== 3) {
    return null;
  }
  const slots = d.m.map((m): PartyMember | null => {
    if (!Array.isArray(m)) return null;
    const [ownerName, uid, packed] = m;
    if (typeof ownerName !== "string") return null;
    const build = unpackSharedBuild(packed as PackedBuild);
    if (!build) return null;
    return { uid: typeof uid === "string" && uid ? uid : null, ownerName, build };
  }) as PartySlots;
  return {
    name: typeof d.n === "string" ? d.n : "",
    blurb: typeof d.d === "string" ? d.d.slice(0, MAX_BLURB) : "",
    slots,
  };
}
