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
//  Whichever way it opens, the party is checked against the builds behind
//  its slots first (refreshParty): edits and relic upgrades land in the
//  slot, and a build that's gone empties its slot with the reason shown.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BuildCard } from "@/components/builds/BuildCard";
import { PartyBuildPicker } from "@/components/builds/PartyBuildPicker";
import { CharacterImg } from "@/components/builds/shared";
import { EMPTY_STORE, type Build } from "@/lib/builds";
import { fetchParty, publishParty, useAuth } from "@/lib/cloud";
import {
  EMPTY_PARTY,
  MAX_BLURB,
  encodeParty,
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
 * One party slot: the member's build, open to its relics, or an invitation to
 * fill the slot. Read-only mode (shared view) hides controls.
 */
function SlotSection({
  index,
  member,
  note,
  readOnly,
  onChoose,
  onClear,
}: {
  index: number;
  member: PartyMember | null;
  /** What the last build check did to this slot, if anything. */
  note?: SlotSyncNote | null;
  readOnly: boolean;
  onChoose?: () => void;
  onClear?: () => void;
}) {
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
  const build: Build | null = member
    ? { ...member.build.build, id: `party-${index}`, updatedAt: 0, relics: member.build.relics }
    : null;
  return (
    <section className="frame flex flex-col rounded-md bg-night-850 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="eyebrow">Slot {index + 1}</p>
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
              title="Pick a different player, build, or loadout for this slot"
              className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright"
            >
              Swap…
            </button>
            <button
              type="button"
              onClick={onClear}
              className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-red-300"
            >
              Clear
            </button>
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
          disabled={readOnly}
          className="w-full flex-1 rounded-md border-2 border-dashed border-night-600 px-4 py-8 font-body text-sm text-parchment-muted transition-colors hover:border-gold-dim hover:text-gold-bright disabled:cursor-default disabled:hover:border-night-600 disabled:hover:text-parchment-muted"
        >
          {readOnly ? "Empty slot" : "+ Choose a build for this slot"}
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
  onChoose,
  onClear,
}: {
  slots: PartySlots;
  /** Per-slot result of the build check (see partySync). */
  notes?: SlotSyncNotes;
  readOnly: boolean;
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
          readOnly={readOnly}
          onChoose={onChoose && (() => onChoose(i))}
          onClear={onClear && (() => onClear(i))}
        />
      ))}
    </div>
  );
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

  useEffect(() => {
    let cancelled = false;
    setSlotNotes(NO_SYNC_NOTES);

    // Whatever the party was saved as, open it on the builds as they stand
    // now. The refresh lands in the draft; Save is what publishes it.
    const start = (loaded: Party) => {
      setParty(loaded);
      setSyncing(true);
      refreshParty(loaded)
        .then(({ party: fresh, notes, changed }) => {
          if (cancelled) return;
          setSlotNotes(notes);
          if (!changed) return;
          // Merge rather than replace: a slot the user filled while the
          // check was in flight is their pick, and stays.
          setParty((prev) =>
            prev
              ? {
                  ...prev,
                  slots: prev.slots.map((s, i) =>
                    s === loaded.slots[i] ? fresh.slots[i] : s,
                  ) as PartySlots,
                }
              : fresh,
          );
        })
        .catch((err) => console.error("Refreshing party builds failed:", err))
        .finally(() => !cancelled && setSyncing(false));
    };

    if (editId) {
      fetchParty(editId)
        .then((cp) => {
          if (cancelled) return;
          if (cp) start(cp.party);
          else {
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
      start(isNew ? EMPTY_PARTY : loadParty());
    }
    return () => {
      cancelled = true;
    };
  }, [editId, isNew]);

  useEffect(() => {
    if (party) setStorageBroken(!saveParty(party));
  }, [party]);

  if (!party) {
    return <p className="font-body text-sm text-parchment-faint">Loading party…</p>;
  }

  const setSlot = (index: number, member: PartyMember | null) => {
    // The note explains what the last check did to the slot; once the user
    // has picked for it themselves, it has nothing left to explain.
    setSlotNotes((n) => n.map((x, i) => (i === index ? null : x)) as SlotSyncNotes);
    setParty((p) => {
      const prev = p ?? EMPTY_PARTY;
      return {
        ...prev,
        slots: prev.slots.map((s, i) => (i === index ? member : s)) as PartySlots,
      };
    });
  };

  const memberCount = party.slots.filter(Boolean).length;

  const copy = async (url: string, kind: "cloud" | "hash") => {
    const roster = party.slots
      .map((s) => (s ? s.build.build.character : "open slot"))
      .join(" / ");
    const text = `${party.name.trim() || "Nightreign party"} — ${roster}\n\n${url}`;
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
      saveParty(EMPTY_PARTY);
      router.push("/builds/party");
    } catch (err) {
      console.error("Saving party failed:", err);
      setShareError("Couldn't save the party to your account — try again in a moment.");
      setSaving(false);
    }
  };

  // Saved parties share by their short ?id= link; unsaved ones fall back to
  // the self-contained hash link. Both land on the Parties page.
  const copyLink = async () => {
    const base = `${window.location.origin}/builds/party`;
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

      <PartySlotGrid
        slots={party.slots}
        notes={slotNotes}
        readOnly={false}
        onChoose={setPickerSlot}
        onClear={(i) => setSlot(i, null)}
      />

      {pickerSlot !== null && (
        <PartyBuildPicker
          slotIndex={pickerSlot}
          current={party.slots[pickerSlot]}
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
