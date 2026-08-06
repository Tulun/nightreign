"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Party planner: the create/edit form. Three slots, each filled with a
//  snapshot of a build from the community directory (or this device).
//  Entry points (query params, all landing on /builds/party/plan):
//    ?new=1     — fresh form (replaces any stored draft)
//    ?edit=<id> — load a published party for editing (Save updates it)
//    (none)     — resume the localStorage draft
//  Saving publishes the party to Firestore (parties/{id}), clears the
//  draft, and returns to the Parties list — so each save is its own
//  party. Signed out, Copy link shares a self-contained #p= hash link.
//  Browsing and opening shared parties happens in PartiesDirectory.
//
//  ?edit= also opens for someone who isn't the owner but is *fielded* in the
//  party, when the owner has left slot edits on: they get their own slot and
//  nothing else — no name, no blurb, no other slot — and Save writes that one
//  field (see updateSlot in lib/party). Which mode the form is in comes from
//  the doc, not the URL, so a link can't talk its way into more than the
//  rules would allow anyway.
//
//  A published party is watched while it's open, so a slot someone else is
//  editing arrives here rather than waiting for a reload. Slots you've
//  touched since loading hold their ground — an incoming snapshot never
//  overwrites unsaved work.
//
//  Whichever way it opens, the party is checked against the builds behind
//  its slots first (refreshParty): edits and relic upgrades land in the
//  slot, and a build that's gone empties its slot with the reason shown.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BuildCard } from "@/components/builds/BuildCard";
import { PartyBuildPicker } from "@/components/builds/PartyBuildPicker";
import { CharacterImg } from "@/components/builds/shared";
import { asset } from "@/lib/assets";
import { EMPTY_STORE, type Build } from "@/lib/builds";
import { fetchParty, publishParty, updateSlot, useAuth, watchParty } from "@/lib/cloud";
import {
  EMPTY_PARTY,
  MAX_BLURB,
  encodeParty,
  isReserved,
  loadParty,
  saveParty,
  type Party,
  type PartyMember,
  type PartySlots,
} from "@/lib/party";
import {
  NO_SYNC_NOTES,
  refreshParty,
  syncNoteText,
  type SlotSyncNote,
  type SlotSyncNotes,
} from "@/lib/partySync";

function Avatar({ name, size }: { name: string; size: number }) {
  return (
    <span
      className="frame grid shrink-0 place-items-center rounded bg-night-900"
      style={{ width: size, height: size }}
    >
      <span className="font-display font-bold text-gold">{name.charAt(0).toUpperCase()}</span>
    </span>
  );
}

/**
 * One member's Normal / Deep of Night switch. It sits in the slot it belongs
 * to rather than above the party: stacked on a phone, a single switch up top
 * is several screens behind you by the time you reach the third member.
 */
function NightViewToggle({
  view,
  onChange,
  className = "",
}: {
  view: "normal" | "deep";
  onChange: (v: "normal" | "deep") => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`} role="group" aria-label="Which relics to show">
      {(["normal", "deep"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={view === v}
          className={`frame rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
            view === v
              ? "bg-night-700 text-gold-bright"
              : "bg-night-900 text-parchment-muted hover:text-parchment"
          }`}
        >
          {v === "normal" ? "Normal" : "Deep of Night"}
        </button>
      ))}
    </div>
  );
}

/**
 * What the viewer may do to one slot.
 *   full   — the party's owner: fill it, swap it, empty it.
 *   mine   — the player fielded here: swap in another build of their own.
 *            Not empty it: who's in the party is the owner's call, and
 *            leaving is done by unsharing the build (which empties the slot
 *            through the usual build check).
 *   locked — someone else's slot, or a read-only view.
 */
export type SlotAccess = "full" | "mine" | "locked";

/**
 * One party slot: the member's build, open to its relics, or an invitation to
 * fill the slot. Controls follow `access`.
 */
function SlotSection({
  index,
  member,
  note,
  access,
  onChoose,
  onClear,
}: {
  index: number;
  member: PartyMember | null;
  /** What the last build check did to this slot, if anything. */
  note?: SlotSyncNote | null;
  access: SlotAccess;
  onChoose?: () => void;
  onClear?: () => void;
}) {
  const readOnly = access === "locked";
  // Which slot set this member shows — each one switches on its own, so a
  // party can be read as everyone's normal run, or one member's Deep of Night
  // relics against the other two.
  const [view, setView] = useState<"normal" | "deep">("normal");
  // Profile links carry where to come back to, so a visit to the owner's
  // profile isn't a one-way trip out of the party. A party opened from a #p=
  // hash link has already had its hash cleared, so that one returns to the
  // parties list rather than to the shared party itself.
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const returnTo = `${pathname}${search ? `?${search}` : ""}`;
  // The snapshot carries its own relics; BuildCard resolves against those.
  // A reserved slot has a member but no snapshot — somebody's in it, they
  // just haven't said what they're running.
  const build: Build | null = member?.build
    ? { ...member.build.build, id: `party-${index}`, updatedAt: 0, relics: member.build.relics }
    : null;
  const reserved = isReserved(member);
  return (
    <section className="frame flex flex-col rounded-md bg-night-850 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="eyebrow">Slot {index + 1}</p>
        {access === "mine" && (
          <span className="rounded border border-gold-dim/60 px-1.5 py-0.5 font-body text-xs text-gold-dim">
            yours
          </span>
        )}
        {/* Who this slot fields, before whose build it is — the Nightfarer is
            what the rest of the party is read against. */}
        {build && <CharacterImg name={build.character} size={32} />}
        {member && (
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={member.ownerName} size={26} />
            <span className="truncate font-body text-sm text-parchment-muted">
              {member.ownerName}
            </span>
            {member.uid && (
              <Link
                href={`/builds/users?u=${encodeURIComponent(member.uid)}&from=${encodeURIComponent(returnTo)}`}
                className="font-body text-sm text-gold-dim hover:text-gold-bright"
              >
                profile →
              </Link>
            )}
            {/* Which of the build's loadouts this slot runs — only builds
                with variants carry one. */}
            {member.variantLabel && (
              <span
                title="Loadout variant"
                className="rounded border border-night-600 bg-night-900 px-1.5 py-0.5 font-body text-xs text-parchment-muted"
              >
                {member.variantLabel}
              </span>
            )}
          </span>
        )}
        {!readOnly && member && (
          <span className="ml-auto flex gap-1.5">
            <button
              type="button"
              onClick={onChoose}
              title={
                access === "mine"
                  ? "Put a different build or loadout of yours in this slot"
                  : "Pick a different player, build, or loadout for this slot"
              }
              className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright"
            >
              {reserved ? "Change…" : "Swap…"}
            </button>
            {access === "full" && (
              <button
                type="button"
                onClick={onClear}
                className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-red-300"
              >
                Clear
              </button>
            )}
          </span>
        )}
      </div>
      {/* Why this slot isn't what it was: refreshed from a build that has
          changed, or emptied because that build is no longer there. */}
      {note && (
        <p
          className={`mb-3 font-body text-xs ${
            note.kind === "updated" ? "text-gold-dim" : "text-parchment-muted"
          }`}
        >
          {syncNoteText(note)}
        </p>
      )}
      {/* Nothing to toggle to unless this member runs Deep of Night relics. */}
      {build && build.deepSlots.some(Boolean) && (
        <NightViewToggle view={view} onChange={setView} className="mb-3" />
      )}
      {build ? (
        <BuildCard
          build={build}
          store={EMPTY_STORE}
          expandable
          defaultExpanded
          nightView={view}
        />
      ) : (
        /* flex-1: beside two filled columns, an open slot is the whole
           column's height rather than a short box floating at its top. */
        <button
          type="button"
          onClick={onChoose}
          // A reserved slot is only the holder's to fill. The owner can still
          // reassign it — that's the Change… button above, not this panel.
          disabled={readOnly || (reserved && access !== "mine")}
          className={`w-full flex-1 rounded-md border-2 border-dashed px-4 py-8 font-body text-sm transition-colors disabled:cursor-default ${
            reserved
              ? "border-gold-faint text-parchment-muted disabled:hover:border-gold-faint"
              : "border-night-600 text-parchment-muted hover:border-gold-dim hover:text-gold-bright disabled:hover:border-night-600 disabled:hover:text-parchment-muted"
          }`}
        >
          {reserved
            ? access === "mine"
              ? "+ Choose your build for this slot"
              : `Saved for ${member?.ownerName} — waiting on their build`
            : readOnly
              ? "Empty slot"
              : "+ Choose a build for this slot"}
        </button>
      )}
    </section>
  );
}

/**
 * The party's three slots: a row of columns on a desktop screen, stacked
 * below that. A column is too narrow for a build card's side-by-side slot
 * sets, and six relics per member would bury the party anyway — so each slot
 * shows one set at a time, switched from inside the slot itself.
 */
export function PartySlotGrid({
  slots,
  notes = NO_SYNC_NOTES,
  readOnly,
  access,
  onChoose,
  onClear,
}: {
  slots: PartySlots;
  /** Per-slot result of the build check (see partySync). */
  notes?: SlotSyncNotes;
  /** Whole grid read-only (the shared view). Ignored when `access` is given. */
  readOnly?: boolean;
  /** Per-slot rights, for a form where they differ slot to slot. */
  access?: SlotAccess[];
  onChoose?: (index: number) => void;
  onClear?: (index: number) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {slots.map((member, i) => (
        <SlotSection
          key={i}
          index={i}
          member={member}
          note={notes[i]}
          access={access?.[i] ?? (readOnly ? "locked" : "full")}
          onChoose={onChoose && (() => onChoose(i))}
          onClear={onClear && (() => onClear(i))}
        />
      ))}
    </div>
  );
}

/** Everything about a party a save would publish — the draft is stale if these differ. */
const partyShape = (p: Party) =>
  JSON.stringify([p.name, p.blurb, p.slotEdits, p.slots.map((s) => s ?? null)]);

/** "slot 2", "slots 1 and 3" — for talking about what just moved. */
function slotList(indices: number[]): string {
  const ns = indices.map((i) => i + 1);
  const noun = ns.length > 1 ? "Slots" : "Slot";
  return `${noun} ${ns.length > 1 ? `${ns.slice(0, -1).join(", ")} and ${ns[ns.length - 1]}` : ns[0]}`;
}

export function PartyPlanner() {
  const user = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  // ?edit=<id> loads that published party; ?new=1 starts a fresh form.
  const editId = params.get("edit");
  const isNew = params.get("new") !== null;
  const [party, setParty] = useState<Party | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [copied, setCopied] = useState<"cloud" | "hash" | null>(null);
  const [saving, setSaving] = useState(false);
  const [storageBroken, setStorageBroken] = useState(false);
  const [slotNotes, setSlotNotes] = useState<SlotSyncNotes>(NO_SYNC_NOTES);
  const [syncing, setSyncing] = useState(false);
  // Who owns the loaded party and who holds each slot — straight from the
  // doc, since that's the copy the rules judge a write against. Null until a
  // ?edit= party lands, and for a draft that has no doc yet.
  const [cloud, setCloud] = useState<{ ownerUid: string | null; slotUids: string[] } | null>(null);
  // What the live watch last saw happen to someone else's slot.
  const [remoteNote, setRemoteNote] = useState<string | null>(null);
  // Slots edited here since the last load or save. An incoming snapshot
  // leaves these alone — nothing arriving from the doc may discard unsaved
  // work — but only for slots this viewer could actually save (writableRef),
  // so a stale local copy of someone else's slot can't freeze it either.
  const dirty = useRef<Set<number>>(new Set());
  // Each slot as the last snapshot had it, so a genuine remote edit is
  // distinguishable from the server echoing our own write back at us.
  const seen = useRef<(string | null)[] | null>(null);
  const ownsRef = useRef(true);
  const writableRef = useRef<number[]>([]);
  // The published party as it actually stands, for discarding back to.
  const docParty = useRef<Party | null>(null);
  // Unsaved edits from a previous visit were picked back up.
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSlotNotes(NO_SYNC_NOTES);
    dirty.current = new Set();
    seen.current = null;

    // Whatever the party was saved as, open it on the builds as they stand
    // now. The refresh lands in the draft; Save is what publishes it.
    //
    // `base` is the published version when `loaded` is a draft that has moved
    // on from it: the slots that differ are the unsaved ones, and marking
    // them held stops the live watch putting the doc's version back.
    const start = (loaded: Party, base?: Party) => {
      if (base) {
        loaded.slots.forEach((s, i) => {
          if (JSON.stringify(s ?? null) !== JSON.stringify(base.slots[i] ?? null)) {
            dirty.current.add(i);
          }
        });
      }
      setParty(loaded);
      setSyncing(true);
      refreshParty(loaded)
        .then(({ party: fresh, notes, changed }) => {
          if (cancelled) return;
          setSlotNotes(notes);
          if (!changed) return;
          // Merge rather than replace: a slot the user filled while the
          // check was in flight is their pick, and stays.
          setParty((prev) => {
            if (!prev) return fresh;
            const slots = prev.slots.map((s, i) => {
              if (s !== loaded.slots[i]) return s;
              // A refreshed slot is a local change the doc doesn't have yet,
              // so it holds against incoming snapshots like any other edit.
              if (fresh.slots[i] !== s) dirty.current.add(i);
              return fresh.slots[i];
            }) as PartySlots;
            return { ...prev, slots };
          });
        })
        .catch((err) => console.error("Refreshing party builds failed:", err))
        .finally(() => !cancelled && setSyncing(false));
    };

    if (editId) {
      fetchParty(editId)
        .then((cp) => {
          if (cancelled) return;
          if (cp) {
            // Before the party, so the first render already knows whose it
            // is — the form must never open editable on someone else's.
            setCloud({ ownerUid: cp.ownerUid, slotUids: cp.slotUids });
            docParty.current = cp.party;
            // The draft is written on every change, but this path re-reads
            // the doc — so without picking the draft back up, a reload after
            // an edit you hadn't saved yet silently threw it away. Only a
            // draft of *this* party counts; anything else belongs to another
            // one and was already consented away on the way in.
            const draft = loadParty();
            const unsaved =
              draft.id === editId && partyShape(draft) !== partyShape(cp.party);
            setRestored(unsaved);
            if (unsaved) start(draft, cp.party);
            else start(cp.party);
          } else {
            setShareError("Couldn't load that party for editing — starting from your draft.");
            start(loadParty());
          }
        })
        .catch((err) => {
          console.error("Loading party for editing failed:", err);
          if (!cancelled) {
            setShareError("Couldn't load that party for editing — starting from your draft.");
            start(loadParty());
          }
        });
    } else {
      setCloud(null);
      start(isNew ? EMPTY_PARTY : loadParty());
    }
    return () => {
      cancelled = true;
    };
  }, [editId, isNew]);

  // ── Who this viewer is here ────────────────────────────────────────────
  //  A draft has no doc and so is always yours. A published one is yours if
  //  you own it; failing that, you get the slots the doc says are yours —
  //  and only while the owner leaves the setting on.
  const owns = !cloud || (!!user && !!cloud.ownerUid && cloud.ownerUid === user.uid);
  const mySlots =
    owns || !cloud || !user || !party?.slotEdits
      ? []
      : cloud.slotUids.flatMap((u, i) => (u && u === user.uid ? [i] : []));
  const slotAccess: SlotAccess[] = [0, 1, 2].map((i) =>
    owns ? "full" : mySlots.includes(i) ? "mine" : "locked",
  );
  /** Nothing here is yours: someone else's party, and no slot of your own. */
  const lockedOut = !owns && mySlots.length === 0;

  useEffect(() => {
    ownsRef.current = owns;
    writableRef.current = owns ? [0, 1, 2] : mySlots;
    // mySlots is rebuilt each render; its contents are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owns, mySlots.join(",")]);

  // Follow the published party while it's open, so a slot someone else is
  // editing arrives here instead of waiting for a reload.
  useEffect(() => {
    if (!editId) return;
    return watchParty(editId, (cp) => {
      setCloud({ ownerUid: cp.ownerUid, slotUids: cp.slotUids });
      docParty.current = cp.party;
      const json = cp.party.slots.map((s) => (s ? JSON.stringify(s) : null));
      const before = seen.current;
      seen.current = json;
      /** Ours to keep: edited here, and ours to save. */
      const held = (i: number) => dirty.current.has(i) && writableRef.current.includes(i);
      setParty((prev) =>
        prev
          ? {
              ...prev,
              // The party's own fields are the owner's; everyone else's copy
              // of them follows the doc.
              ...(ownsRef.current
                ? {}
                : { name: cp.party.name, blurb: cp.party.blurb, slotEdits: cp.party.slotEdits }),
              slots: prev.slots.map((s, i) => (held(i) ? s : cp.party.slots[i])) as PartySlots,
            }
          : cp.party,
      );
      // The first snapshot after the fetch is just the doc we already have.
      if (!before) return;
      const moved = json.flatMap((j, i) => (j !== before[i] ? [i] : []));
      const clash = moved.filter(held);
      const landed = moved.filter((i) => !held(i));
      if (clash.length) {
        setRemoteNote(
          `${slotList(clash)} changed while you were editing it — your unsaved version is still here, and saving replaces theirs.`,
        );
      } else if (landed.length) {
        const who = landed.map((i) => cp.party.slots[i]?.ownerName).filter(Boolean)[0];
        setRemoteNote(
          `${slotList(landed)} was just updated${who ? ` by ${who}` : ""} — you're seeing the current version.`,
        );
      }
    });
  }, [editId]);

  useEffect(() => {
    // Only your own party belongs in your draft; someone else's is theirs.
    if (party && owns) setStorageBroken(!saveParty(party));
  }, [party, owns]);

  // Who you are decides what this form is, so a published party waits for
  // auth to finish restoring (useAuth is undefined until then) rather than
  // showing its owner the read-only view for a frame.
  if (!party || (cloud && user === undefined)) {
    return <p className="font-body text-sm text-parchment-faint">Loading party…</p>;
  }

  const setSlot = (index: number, member: PartyMember | null) => {
    // The note explains what the last check did to the slot; once the user
    // has picked for it themselves, it has nothing left to explain.
    setSlotNotes((n) => n.map((x, i) => (i === index ? null : x)) as SlotSyncNotes);
    dirty.current.add(index);
    setParty((p) => {
      const prev = p ?? EMPTY_PARTY;
      return {
        ...prev,
        slots: prev.slots.map((s, i) => (i === index ? member : s)) as PartySlots,
      };
    });
  };

  const memberCount = party.slots.filter(Boolean).length;

  // What Copy link puts on the clipboard: a caption, then the URL alone on
  // its own line (see buildShareText for why). The caption is the name and
  // roster, plus the blurb when there is one — the pitch travels with the
  // link instead of waiting to be discovered on the page.
  const copy = async (url: string, kind: "cloud" | "hash") => {
    const roster = party.slots
      .map((s) => (s?.build ? s.build.build.character : s ? `${s.ownerName} (TBD)` : "open slot"))
      .join(" / ");
    const blurb = party.blurb.trim();
    const caption = `${party.name.trim() || "Nightreign party"} — ${roster}`;
    const text = `${caption}${blurb ? `\n${blurb}` : ""}\n\n${url}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  // Publish (or update) the party's cloud doc, then clear the draft and
  // return to the list — each save is its own party, so the form is free
  // for the next one.
  const save = async () => {
    if (!user) return;
    setShareError(null);
    setSaving(true);
    try {
      await publishParty(party, user.uid);
      dirty.current = new Set();
      saveParty(EMPTY_PARTY);
      router.push("/builds/party");
    } catch (err) {
      console.error("Saving party failed:", err);
      setShareError("Couldn't save the party to your account — try again in a moment.");
      setSaving(false);
    }
  };

  // Someone else's party, your slot: one field per slot you hold, and the
  // party itself untouched. Then back to the party as everyone else sees it.
  const saveMySlot = async () => {
    const id = party.id;
    if (!id) return;
    setShareError(null);
    setSaving(true);
    try {
      for (const i of mySlots) {
        const member = party.slots[i];
        if (!dirty.current.has(i) || !member) continue;
        await updateSlot(id, i, member);
        // Recorded as seen, so the server echoing this back doesn't read as
        // somebody else having changed the slot.
        if (seen.current) seen.current[i] = JSON.stringify(member);
        dirty.current.delete(i);
      }
      router.push(`/builds/party?id=${encodeURIComponent(id)}`);
    } catch (err) {
      console.error("Saving your slot failed:", err);
      setShareError(
        "Couldn't save your slot — the owner may have turned slot edits off, or filled it with someone else.",
      );
      setSaving(false);
    }
  };

  // Saved parties share by their short ?id= link; unsaved ones fall back to
  // the self-contained hash link. Both land on the Parties page.
  //
  // asset() puts the base path back on: on GitHub Pages the site is served
  // from /nightreign/, and an origin-plus-route URL built without it is a
  // 404 for whoever it's pasted to. The trailing slash is the route as
  // exported (next.config trailingSlash) — Pages redirects to it anyway, but
  // the link on the clipboard shouldn't need the redirect to work.
  const copyLink = async () => {
    const base = `${window.location.origin}${asset("/builds/party/")}`;
    if (party.id) await copy(`${base}?id=${party.id}`, "cloud");
    else await copy(`${base}#p=${await encodeParty(party)}`, "hash");
  };

  return (
    <div>
      {storageBroken && (
        <p className="mb-4 font-body text-sm text-red-200">
          Saving to this browser failed — your party only lives in this tab. Copy a share link to
          keep it.
        </p>
      )}
      {shareError && <p className="mb-4 font-body text-sm text-red-200">{shareError}</p>}
      {remoteNote && (
        <p className="mb-4 font-body text-sm text-gold-dim" role="status">
          {remoteNote}
        </p>
      )}
      {/* Picked back up rather than thrown away — but the party as published
          doesn't have these yet, which is worth being explicit about. */}
      {restored && (
        <div className="mb-4 flex flex-wrap items-center gap-3" role="status">
          <p className="font-body text-base text-gold-dim">
            Changes you hadn&rsquo;t saved are back. They aren&rsquo;t published until you save.
          </p>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm("Discard your unsaved changes to this party?")) return;
              dirty.current = new Set();
              setRestored(false);
              setSlotNotes(NO_SYNC_NOTES);
              if (docParty.current) setParty(docParty.current);
              saveParty(EMPTY_PARTY);
            }}
            className="rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:text-red-300"
          >
            Discard them
          </button>
        </div>
      )}

      {/* ── Someone else's party ────────────────────────────────────────
          Your slot and nothing else: the name, the blurb and the other two
          slots are the owner's, and are shown as they stand. */}
      {!owns && (
        <section className="frame mb-5 rounded-md bg-night-850 p-4">
          <h3 className="font-display text-lg font-semibold text-parchment">
            {party.name.trim() || "Untitled party"}
          </h3>
          {party.blurb.trim() && (
            <p className="mt-1 max-w-prose font-body text-sm italic text-parchment-muted">
              {party.blurb}
            </p>
          )}
          <p className="mt-2 max-w-prose font-body text-base text-parchment-muted">
            {lockedOut
              ? "This party isn't yours, and no slot in it is either — nothing here can be edited. Its owner can hand you a slot by saving one for you, or by putting one of your builds in it."
              : mySlots.every((i) => isReserved(party.slots[i]))
                ? `${slotList(mySlots)} has been saved for you — pick one of your builds for it. Saving writes just that slot; the party, and everything else in it, is the owner's.`
                : `This party belongs to someone else. ${slotList(mySlots)} is yours: swap in a different build or loadout of your own, and saving writes just that slot. Everything else is the owner's.`}
          </p>
          {!lockedOut && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void saveMySlot()}
                disabled={saving || !mySlots.some((i) => dirty.current.has(i) && party.slots[i])}
                title={
                  mySlots.some((i) => dirty.current.has(i))
                    ? undefined
                    : "Swap in a different build first"
                }
                className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600 disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save my slot"}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/builds/party?id=${encodeURIComponent(party.id ?? "")}`)}
                className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
              >
                Cancel
              </button>
            </div>
          )}
        </section>
      )}

      {owns && (
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={party.name}
          onChange={(e) => setParty((p) => ({ ...(p ?? EMPTY_PARTY), name: e.target.value }))}
          placeholder="Party name (required)"
          maxLength={60}
          className="frame w-64 max-w-full rounded bg-night-900 px-3 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={memberCount === 0 || !party.name.trim() || saving || !user}
          title={
            !user
              ? "Sign in to save parties to your account"
              : !party.name.trim()
                ? "Name the party to save it"
                : undefined
          }
          className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600 disabled:opacity-40"
        >
          {saving ? "Saving…" : party.id ? "Save changes" : "Save party"}
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          disabled={memberCount === 0 || !party.name.trim()}
          title={party.name.trim() ? undefined : "Name the party to share it"}
          className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-40"
        >
          {copied ? "Link copied ✓" : "Copy link"}
        </button>
        {memberCount > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all three slots?")) {
                setSlotNotes(NO_SYNC_NOTES);
                setParty((p) => ({ ...(p ?? EMPTY_PARTY), slots: [null, null, null] }));
              }
            }}
            className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
          >
            Clear party
          </button>
        )}
        <span className="basis-full">
          <textarea
            value={party.blurb}
            onChange={(e) =>
              setParty((p) => ({
                ...(p ?? EMPTY_PARTY),
                blurb: e.target.value.slice(0, MAX_BLURB),
              }))
            }
            placeholder="A short blurb about the party — strategy, target Nightlord… (optional)"
            maxLength={MAX_BLURB}
            rows={2}
            className="frame w-full max-w-2xl resize-y rounded bg-night-900 px-3 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint focus:outline-none"
          />
          {party.blurb.length > 0 && (
            <span className="block font-body text-[0.65rem] text-parchment-faint">
              {party.blurb.length}/{MAX_BLURB}
            </span>
          )}
        </span>
        {/* Who else may touch this party. A slot's holder is whoever's build
            fills it, so this grants nothing until the slots are filled — and
            never more than the one slot each. */}
        <label className="basis-full font-body text-base text-parchment-muted">
          <input
            type="checkbox"
            checked={party.slotEdits}
            onChange={(e) =>
              setParty((p) => ({ ...(p ?? EMPTY_PARTY), slotEdits: e.target.checked }))
            }
            className="mr-2 align-middle accent-gold"
          />
          Let each player edit their own slot{" "}
          <span className="text-parchment-faint">
            — they can swap in a different build of theirs; the party, and every other slot, stays
            yours.
          </span>
        </label>
        {/* A slot saved for someone is inert while this is off — they'd open
            the party and find nothing they can do. Worth saying plainly
            rather than letting them discover it. */}
        {!party.slotEdits && party.slots.some(isReserved) && (
          <p className="basis-full font-body text-sm text-red-200">
            {slotList(party.slots.flatMap((s, i) => (isReserved(s) ? [i] : [])))} is saved for a
            player, but slot edits are off — turn them on or they can&rsquo;t fill it.
          </p>
        )}
        <span className="basis-full font-body text-xs text-parchment-faint">
          {syncing
            ? "Checking each slot against its build… "
            : "Drafts stay on this device; opening a party re-reads every slot from its owner's build, so edits and relic upgrades follow it here. A build its owner has deleted leaves its slot empty. "}
          {user
            ? party.id
              ? "Saving updates this published party and returns you to the Parties list."
              : "Saving publishes this as its own party on the Parties list — create as many as you like."
            : "Sign in to save parties to your account — Copy link still works signed out, the link itself carrying the whole party."}
        </span>
      </div>
      )}

      <PartySlotGrid
        slots={party.slots}
        notes={slotNotes}
        access={slotAccess}
        onChoose={setPickerSlot}
        onClear={(i) => setSlot(i, null)}
      />

      {pickerSlot !== null && (
        <PartyBuildPicker
          slotIndex={pickerSlot}
          current={party.slots[pickerSlot]}
          // Editing your own slot of someone else's party fills it from your
          // builds only — the picker's player step would be a dead end.
          onlyUid={owns ? undefined : (user?.uid ?? undefined)}
          // Handing a slot out is the owner's to do. Filling your own slot
          // means picking a build, not reserving it from yourself.
          onReserve={
            owns
              ? (member) => {
                  setSlot(pickerSlot, member);
                  setPickerSlot(null);
                }
              : undefined
          }
          onPick={(member) => {
            setSlot(pickerSlot, member);
            setPickerSlot(null);
          }}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </div>
  );
}
