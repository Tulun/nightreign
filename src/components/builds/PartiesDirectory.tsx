"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Parties: the browse view. Lists every published party (parties/{id} in
//  Firestore) with a button through to the planner (/builds/party/plan)
//  for assembling your own. Share links land here too — ?id= for published
//  docs, #p= for self-contained hash links — and render the party
//  read-only; your own parties carry Edit and Delete from here.
//
//  A party someone else owns can still carry an entry point of its own: if
//  one of its slots is fielding your build and the owner left slot edits on,
//  "Edit my slot" opens the planner on that one slot (see PartyPlanner).
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PartySlotGrid } from "@/components/builds/PartyPlanner";
import { CharacterImg } from "@/components/builds/shared";
import { cloudErrorMessage } from "@/lib/cloudRead";
import {
  deleteParty,
  fetchParty,
  listParties,
  listProfiles,
  useAuth,
  type PartySummary,
} from "@/lib/cloud";
import { decodeParty, loadParty, saveParty, type CloudParty, type Party } from "@/lib/party";
import { NO_SYNC_NOTES, refreshParty, type SlotSyncNotes } from "@/lib/partySync";

/** Which slots of a party this account may edit without owning it. */
function claimedSlots(
  slotUids: string[],
  slotEdits: boolean,
  uid: string | null | undefined,
): number[] {
  if (!slotEdits || !uid) return [];
  return slotUids.flatMap((u, i) => (u && u === uid ? [i] : []));
}

/**
 * Every published party, browseable by anyone — click through to its
 * ?id= view. Your own entries get a Delete button.
 */
function PartiesList({ ownUid }: { ownUid: string | null }) {
  const router = useRouter();
  const [parties, setParties] = useState<PartySummary[] | null>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listParties()
      .then((p) => !cancelled && setParties(p))
      .catch((err) => {
        console.error("Loading published parties failed:", err);
        if (!cancelled) setError(cloudErrorMessage(err, "the published parties"));
      });
    listProfiles()
      .then((ps) => !cancelled && setNames(new Map(ps.map((p) => [p.uid, p.displayName]))))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Open a published party in the planner. Warn first if that would
  // replace a never-published draft (a published draft is safe to drop —
  // its cloud copy survives).
  const edit = (id: string) => {
    const draft = loadParty();
    if (
      !draft.id &&
      draft.slots.some(Boolean) &&
      !window.confirm("Edit this party? Your unsaved draft will be replaced.")
    ) {
      return;
    }
    router.push(`/builds/party/plan?edit=${encodeURIComponent(id)}`);
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this published party? Its link will stop working.")) return;
    setDeleting(id);
    try {
      await deleteParty(id);
      setParties((ps) => ps?.filter((p) => p.id !== id) ?? ps);
      // If the planner draft was published as this doc, unlink it so a
      // future Save mints a fresh id instead of resurrecting the deleted one.
      const draft = loadParty();
      if (draft.id === id) {
        const { id: _dropped, ...rest } = draft;
        saveParty(rest);
      }
    } catch (err) {
      console.error("Deleting party failed:", err);
      window.alert("Couldn't delete the party — try again in a moment.");
    } finally {
      setDeleting(null);
    }
  };

  if (error) {
    return (
      <div className="frame rounded-md border border-red-900/60 bg-night-850 px-4 py-3" role="alert">
        <p className="font-body text-sm text-red-200">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setParties(null);
            setAttempt((a) => a + 1);
          }}
          className="mt-2 rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright"
        >
          Try again
        </button>
      </div>
    );
  }
  if (!parties) {
    return <p className="font-body text-sm text-parchment-faint">Loading parties…</p>;
  }
  if (parties.length === 0) {
    return (
      <p className="font-body text-sm text-parchment-faint">
        No published parties yet — create one and it will show up here.
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {parties.map((p) => {
        const owner =
          (p.ownerUid && names.get(p.ownerUid)) ||
          (p.ownerUid ? `Nightfarer-${p.ownerUid.slice(0, 4)}` : "Unknown player");
        const isMine = p.ownerUid === ownUid;
        const mySlots = isMine ? [] : claimedSlots(p.slotUids, p.slotEdits, ownUid);
        return (
          <div
            key={p.id}
            className="frame flex flex-col rounded-md bg-night-800 p-4 transition-colors hover:bg-night-700"
          >
            <button
              type="button"
              onClick={() => router.push(`/builds/party?id=${encodeURIComponent(p.id)}`)}
              className="min-w-0 text-left"
            >
              <span className="block truncate font-display font-semibold text-parchment">
                {p.name || "Unnamed party"}
                {isMine && (
                  <span className="ml-1.5 font-body text-xs font-normal text-gold-dim">yours</span>
                )}
                {mySlots.length > 0 && (
                  <span className="ml-1.5 font-body text-xs font-normal text-gold-dim">
                    you&rsquo;re in this
                  </span>
                )}
              </span>
              {/* The roster as faces rather than a run of names — an open
                  slot keeps its place as an empty frame, so a party of two
                  still reads as a party of three with a gap in it. */}
              {p.roster.length > 0 ? (
                <span className="mt-1.5 flex items-center gap-1.5">
                  {p.roster.map((r, i) =>
                    r ? (
                      <CharacterImg key={i} name={r} size={30} />
                    ) : (
                      <span
                        key={i}
                        title="Open slot"
                        className="block shrink-0 rounded border border-dashed border-night-600"
                        style={{ width: 30, height: 30 }}
                      />
                    ),
                  )}
                </span>
              ) : (
                <span className="block font-body text-xs text-parchment-faint">Empty party</span>
              )}
              {p.blurb && (
                <span className="mt-1 block font-body text-xs italic text-parchment-muted">
                  {p.blurb}
                </span>
              )}
            </button>
            <span className="mt-2 flex items-center gap-2 font-body text-xs text-parchment-faint">
              {owner}
              {p.updatedAt !== null && ` · ${new Date(p.updatedAt).toLocaleDateString()}`}
              {isMine && (
                <span className="ml-auto flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => edit(p.id)}
                    className="rounded border border-night-600 px-2 py-0.5 text-parchment-muted hover:text-gold-bright"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(p.id)}
                    disabled={deleting === p.id}
                    className="rounded border border-night-600 px-2 py-0.5 text-parchment-muted hover:text-red-300 disabled:opacity-50"
                  >
                    {deleting === p.id ? "Deleting…" : "Delete"}
                  </button>
                </span>
              )}
              {/* Someone else's party, but a slot of it is yours. No draft
                  warning: editing a slot never touches your own draft. */}
              {mySlots.length > 0 && (
                <span className="ml-auto flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/builds/party/plan?edit=${encodeURIComponent(p.id)}`)
                    }
                    className="rounded border border-night-600 px-2 py-0.5 text-parchment-muted hover:text-gold-bright"
                  >
                    Edit my slot
                  </button>
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function PartiesDirectory() {
  const user = useAuth();
  const router = useRouter();
  // A published party's id rides the query string (a static export can't
  // prerender /party/{id} paths — same trade as /builds/users?u=).
  const sharedId = useSearchParams().get("id");
  // A shared party (from ?id= or a #p= link), shown read-only.
  const [shared, setShared] = useState<CloudParty | null>(null);
  // What the build check did to the shared party's slots. A read-only view
  // never writes the party back — it shows the builds as they are now, and
  // the owner's next Save is what makes that stick.
  const [sharedNotes, setSharedNotes] = useState<SlotSyncNotes>(NO_SYNC_NOTES);
  // The link resolved to nothing (stale/deleted/truncated) …
  const [linkError, setLinkError] = useState(false);
  // … versus the read itself failing, which is a different message.
  const [linkFetchError, setLinkFetchError] = useState<string | null>(null);
  const [deletingShared, setDeletingShared] = useState(false);
  // The local planner draft (for the continue-draft link and overwrite
  // confirms). Null until read client-side.
  const [draft, setDraft] = useState<Party | null>(null);

  /**
   * Show a party, then re-read each slot from the build it was taken from —
   * a shared party opens on its members' current builds, not on whatever
   * they held the day it was published.
   */
  const showShared = (cp: CloudParty, cancelled: () => boolean) => {
    setShared(cp);
    setSharedNotes(NO_SYNC_NOTES);
    refreshParty(cp.party)
      .then(({ party: fresh, notes, changed }) => {
        if (cancelled()) return;
        setSharedNotes(notes);
        if (changed) setShared({ ...cp, party: fresh });
      })
      .catch((err) => console.error("Refreshing party builds failed:", err));
  };

  useEffect(() => {
    let cancelled = false;
    setDraft(loadParty());
    // Legacy/self-contained links carry the party in the hash — read it
    // once and clear it so a reload doesn't re-trigger.
    const m = window.location.hash.match(/^#p=(.+)$/);
    if (m) {
      decodeParty(m[1]).then((p) => {
        if (cancelled) return;
        // A hash link carries the party alone — no doc, so no owner and no
        // slot claims behind it.
        if (p) showShared({ party: p, ownerUid: null, slotUids: [] }, () => cancelled);
        else setLinkError(true);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Published-party links: fetch the doc whenever ?id= changes.
  useEffect(() => {
    if (!sharedId) return;
    let cancelled = false;
    fetchParty(sharedId)
      .then((cp) => {
        if (cancelled) return;
        if (cp) showShared(cp, () => cancelled);
        else setLinkError(true);
      })
      .catch((err) => {
        console.error("Loading shared party failed:", err);
        if (!cancelled) setLinkFetchError(cloudErrorMessage(err, "that party"));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedId]);

  // Waiting on the ?id= fetch.
  if (sharedId && !shared && !linkError && !linkFetchError) {
    return <p className="font-body text-sm text-parchment-faint">Loading party…</p>;
  }

  const dismissShared = () => {
    setShared(null);
    setSharedNotes(NO_SYNC_NOTES);
    setLinkError(false);
    setLinkFetchError(null);
    if (sharedId) router.replace("/builds/party");
  };

  const draftCount = draft?.slots.filter(Boolean).length ?? 0;
  // A never-published draft is the only thing an overwrite actually loses.
  const draftUnsaved = draftCount > 0 && !draft?.id;

  // ── Own-party controls on the shared view ──────────────────────────────
  const sharedIsMine = !!shared && !!user && shared.ownerUid === user.uid;
  // Not yours, but a slot of it is.
  const sharedMySlots =
    shared && !sharedIsMine
      ? claimedSlots(shared.slotUids, shared.party.slotEdits, user?.uid)
      : [];

  const editShared = () => {
    const id = shared?.party.id;
    if (!id) return;
    if (
      draftUnsaved &&
      !window.confirm("Edit this party? Your unsaved draft will be replaced.")
    ) {
      return;
    }
    router.push(`/builds/party/plan?edit=${encodeURIComponent(id)}`);
  };

  const deleteShared = async () => {
    const id = shared?.party.id;
    if (!id) return;
    if (!window.confirm("Delete this published party? Its link will stop working.")) return;
    setDeletingShared(true);
    try {
      await deleteParty(id);
      // Unlink the planner draft if it was published as this doc.
      const localDraft = loadParty();
      if (localDraft.id === id) {
        const { id: _dropped, ...rest } = localDraft;
        saveParty(rest);
        setDraft(rest);
      }
      dismissShared();
    } catch (err) {
      console.error("Deleting party failed:", err);
      window.alert("Couldn't delete the party — try again in a moment.");
    } finally {
      setDeletingShared(false);
    }
  };

  // Start a fresh party, warning if that discards a never-published draft.
  const createNew = () => {
    if (
      draftUnsaved &&
      !window.confirm("Start a fresh party? Your unsaved draft will be replaced.")
    ) {
      return;
    }
    router.push("/builds/party/plan?new=1");
  };

  // ── Shared-link view: someone's published party, read-only ─────────────
  if (shared) {
    return (
      <div>
        <section className="frame mb-5 rounded-md bg-night-850 p-4" style={{ borderColor: "#c9a227" }}>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-parchment">
              {shared.party.name.trim() || "Shared party"}
            </h3>
            <span className="font-body text-xs text-parchment-faint">
              {sharedIsMine
                ? "This is your published party."
                : sharedMySlots.length > 0
                  ? `Slot ${sharedMySlots.map((i) => i + 1).join(" and ")} is yours — you can swap in a different build of your own.`
                  : `A party of ${shared.party.slots.filter(Boolean).length}.`}
            </span>
            <div className="ml-auto flex gap-2">
              {sharedMySlots.length > 0 && shared.party.id && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/builds/party/plan?edit=${encodeURIComponent(shared.party.id as string)}`,
                    )
                  }
                  className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
                >
                  Edit my slot
                </button>
              )}
              {sharedIsMine && (
                <>
                  <button
                    type="button"
                    onClick={editShared}
                    className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
                  >
                    Edit party
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteShared()}
                    disabled={deletingShared}
                    className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:text-red-300 disabled:opacity-50"
                  >
                    {deletingShared ? "Deleting…" : "Delete"}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={dismissShared}
                className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:text-parchment"
              >
                ← All parties
              </button>
            </div>
          </div>
          {shared.party.blurb.trim() && (
            <p className="mt-2 max-w-prose font-body text-sm italic text-parchment-muted">
              {shared.party.blurb}
            </p>
          )}
        </section>
        <PartySlotGrid slots={shared.party.slots} notes={sharedNotes} readOnly />
      </div>
    );
  }

  // ── Directory: the published-parties list, with the planner a click away ─
  return (
    <div>
      {linkError && (
        <p className="mb-4 font-body text-sm text-red-200">
          That party link couldn&rsquo;t be opened — it may be stale, deleted, or truncated when
          pasted.
        </p>
      )}
      {linkFetchError && (
        <p className="mb-4 font-body text-sm text-red-200" role="alert">
          {linkFetchError}
        </p>
      )}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={createNew}
          className="frame rounded-md bg-night-700 px-4 py-2 font-body text-sm text-gold-bright hover:bg-night-600"
        >
          + Create a party
        </button>
        {draftCount > 0 && (
          <Link
            href="/builds/party/plan"
            className="font-body py-1 text-base text-gold-dim hover:text-gold-bright"
          >
            Continue your draft ({draftCount}/3 slots) →
          </Link>
        )}
      </div>
      <PartiesList ownUid={user?.uid ?? null} />
    </div>
  );
}
