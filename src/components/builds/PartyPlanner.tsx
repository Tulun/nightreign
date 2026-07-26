"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Party Planner: three slots, each filled with a snapshot of a build from
//  the community directory (or this device). The draft lives in
//  localStorage. Sharing publishes the party to Firestore (parties/{id})
//  for a short /builds/party?id= link when signed in; signed out it falls
//  back to a self-contained #p= hash link. Opening either kind shows the
//  party read-only with the option to load it into your own planner.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BuildCard } from "@/components/builds/BuildCard";
import { PartyBuildPicker } from "@/components/builds/PartyBuildPicker";
import { EMPTY_STORE, type Build } from "@/lib/builds";
import { listProfiles } from "@/lib/cloudSync";
import { useAuth } from "@/lib/useAuth";
import {
  EMPTY_PARTY,
  MAX_BLURB,
  decodeParty,
  deleteParty,
  encodeParty,
  fetchParty,
  listParties,
  loadParty,
  publishParty,
  saveParty,
  type Party,
  type PartyMember,
  type PartySlots,
  type PartySummary,
} from "@/lib/party";

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
 * One party slot: the member's build as a collapsed, expandable card, or an
 * invitation to fill the slot. Read-only mode (shared view) hides controls.
 */
function SlotSection({
  index,
  member,
  readOnly,
  onChoose,
  onClear,
}: {
  index: number;
  member: PartyMember | null;
  readOnly: boolean;
  onChoose?: () => void;
  onClear?: () => void;
}) {
  // The snapshot carries its own relics; BuildCard resolves against those.
  const build: Build | null = member
    ? { ...member.build.build, id: `party-${index}`, updatedAt: 0, relics: member.build.relics }
    : null;
  return (
    <section className="frame rounded-md bg-night-850 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="eyebrow">Slot {index + 1}</p>
        {member && (
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={member.ownerName} size={26} />
            <span className="truncate font-body text-sm text-parchment-muted">
              {member.ownerName}
            </span>
            {member.uid && (
              <Link
                href={`/builds/users?u=${encodeURIComponent(member.uid)}`}
                className="font-body text-xs text-gold-dim hover:text-gold-bright"
              >
                profile →
              </Link>
            )}
          </span>
        )}
        {!readOnly && member && (
          <span className="ml-auto flex gap-1.5">
            <button
              type="button"
              onClick={onChoose}
              className="rounded border border-night-600 px-2 py-0.5 font-body text-xs text-parchment-muted hover:text-gold-bright"
            >
              Swap build
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
      {build ? (
        <BuildCard build={build} store={EMPTY_STORE} expandable />
      ) : (
        <button
          type="button"
          onClick={onChoose}
          disabled={readOnly}
          className="w-full rounded-md border-2 border-dashed border-night-600 px-4 py-8 font-body text-sm text-parchment-muted transition-colors hover:border-gold-dim hover:text-gold-bright disabled:cursor-default disabled:hover:border-night-600 disabled:hover:text-parchment-muted"
        >
          {readOnly ? "Empty slot" : "+ Choose a build for this slot"}
        </button>
      )}
    </section>
  );
}

/**
 * Every published party, browseable by anyone — click through to its
 * ?id= view. Your own entries get a Delete button. Remounted (via key)
 * after a publish so the list stays fresh.
 */
function PublishedParties({
  ownUid,
  currentId,
  onDeletedCurrent,
}: {
  ownUid: string | null;
  /** The planner draft's published id, so deleting it can unlink the draft. */
  currentId?: string;
  onDeletedCurrent: () => void;
}) {
  const router = useRouter();
  const [parties, setParties] = useState<PartySummary[] | null>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listParties()
      .then((p) => !cancelled && setParties(p))
      .catch((err) => {
        console.error("Loading published parties failed:", err);
        if (!cancelled) setError(true);
      });
    listProfiles()
      .then((ps) => !cancelled && setNames(new Map(ps.map((p) => [p.uid, p.displayName]))))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this published party? Its link will stop working.")) return;
    setDeleting(id);
    try {
      await deleteParty(id);
      setParties((ps) => ps?.filter((p) => p.id !== id) ?? ps);
      if (id === currentId) onDeletedCurrent();
    } catch (err) {
      console.error("Deleting party failed:", err);
      window.alert("Couldn't delete the party — try again in a moment.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section className="mt-10">
      <p className="eyebrow mb-3">Published Parties</p>
      {error ? (
        <p className="font-body text-sm text-parchment-faint">
          Couldn&rsquo;t load published parties — try again in a moment.
        </p>
      ) : !parties ? (
        <p className="font-body text-sm text-parchment-faint">Loading parties…</p>
      ) : parties.length === 0 ? (
        <p className="font-body text-sm text-parchment-faint">
          No published parties yet — share one and it will show up here.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {parties.map((p) => {
            const owner =
              (p.ownerUid && names.get(p.ownerUid)) ||
              (p.ownerUid ? `Nightfarer-${p.ownerUid.slice(0, 4)}` : "Unknown player");
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
                    {p.ownerUid === ownUid && (
                      <span className="ml-1.5 font-body text-xs font-normal text-gold-dim">yours</span>
                    )}
                  </span>
                  <span className="block font-body text-xs text-parchment-faint">
                    {p.roster.map((r) => r ?? "open slot").join(" / ") || "Empty party"}
                  </span>
                  {p.blurb && (
                    <span className="mt-1 block font-body text-xs italic text-parchment-muted">
                      {p.blurb}
                    </span>
                  )}
                </button>
                <span className="mt-2 flex items-center gap-2 font-body text-xs text-parchment-faint">
                  {owner}
                  {p.updatedAt !== null && ` · ${new Date(p.updatedAt).toLocaleDateString()}`}
                  {p.ownerUid === ownUid && (
                    <button
                      type="button"
                      onClick={() => void remove(p.id)}
                      disabled={deleting === p.id}
                      className="ml-auto rounded border border-night-600 px-2 py-0.5 text-parchment-muted hover:text-red-300 disabled:opacity-50"
                    >
                      {deleting === p.id ? "Deleting…" : "Delete"}
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function PartyPlanner() {
  const user = useAuth();
  const router = useRouter();
  // A published party's id rides the query string (a static export can't
  // prerender /party/{id} paths — same trade as /builds/users?u=).
  const sharedId = useSearchParams().get("id");
  const [party, setParty] = useState<Party | null>(null);
  // A shared party (from ?id= or a #p= link), shown read-only.
  const [shared, setShared] = useState<{ party: Party; ownerUid: string | null } | null>(null);
  const [linkError, setLinkError] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [copied, setCopied] = useState<"cloud" | "hash" | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [storageBroken, setStorageBroken] = useState(false);
  // Bumped after each publish — remounts the list so it shows the new party.
  const [publishCount, setPublishCount] = useState(0);

  useEffect(() => {
    setParty(loadParty());
    // Legacy/self-contained links carry the party in the hash — read it
    // once and clear it so a reload doesn't re-trigger.
    const m = window.location.hash.match(/^#p=(.+)$/);
    if (m) {
      decodeParty(m[1]).then((p) => {
        if (p) setShared({ party: p, ownerUid: null });
        else setLinkError(true);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      });
    }
  }, []);

  // Published-party links: fetch the doc whenever ?id= changes.
  useEffect(() => {
    if (!sharedId) return;
    let cancelled = false;
    fetchParty(sharedId)
      .then((cp) => {
        if (cancelled) return;
        if (cp) setShared(cp);
        else setLinkError(true);
      })
      .catch((err) => {
        console.error("Loading shared party failed:", err);
        if (!cancelled) setLinkError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sharedId]);

  useEffect(() => {
    if (party) setStorageBroken(!saveParty(party));
  }, [party]);

  // Waiting on the ?id= fetch (or the initial localStorage load).
  if (!party || (sharedId && !shared && !linkError)) {
    return <p className="font-body text-sm text-parchment-faint">Loading party…</p>;
  }

  const setSlot = (index: number, member: PartyMember | null) =>
    setParty((p) => {
      const prev = p ?? EMPTY_PARTY;
      return {
        ...prev,
        slots: prev.slots.map((s, i) => (i === index ? member : s)) as PartySlots,
      };
    });

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

  // Publish (or update) the party's cloud doc — the explicit "Save".
  const save = async () => {
    if (!user) return;
    setShareError(null);
    setSaving(true);
    try {
      const id = await publishParty(party, user.uid);
      if (id !== party.id) setParty((p) => ({ ...(p ?? EMPTY_PARTY), id }));
      setPublishCount((c) => c + 1);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (err) {
      console.error("Saving party failed:", err);
      setShareError("Couldn't save the party to your account — try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  // Saved parties share by their short ?id= link; unsaved ones fall back to
  // the self-contained hash link.
  const copyLink = async () => {
    const base = `${window.location.origin}${window.location.pathname}`;
    if (party.id) await copy(`${base}?id=${party.id}`, "cloud");
    else await copy(`${base}#p=${await encodeParty(party)}`, "hash");
  };

  const dismissShared = () => {
    setShared(null);
    setLinkError(false);
    if (sharedId) router.replace("/builds/party");
  };

  const loadShared = () => {
    if (!shared) return;
    if (
      memberCount > 0 &&
      !window.confirm("Load this shared party into your planner? It replaces your current party.")
    ) {
      return;
    }
    // Keep the doc id only if it's yours — then Share updates the same
    // link. Someone else's party becomes a fresh draft you own.
    const mine = !!user && shared.ownerUid === user.uid;
    const { id: _dropped, ...rest } = shared.party;
    setParty(mine ? shared.party : rest);
    dismissShared();
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
              {user && shared.ownerUid === user.uid
                ? "This is your published party — load it into your planner to edit it."
                : `This link carries a party of ${shared.party.slots.filter(Boolean).length} — load it into your planner to tweak or re-share it, or dismiss it to keep yours.`}
            </span>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={loadShared}
                className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
              >
                Load into planner
              </button>
              <button
                type="button"
                onClick={dismissShared}
                className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:text-parchment"
              >
                Dismiss
              </button>
            </div>
          </div>
          {shared.party.blurb.trim() && (
            <p className="mt-2 max-w-prose font-body text-sm italic text-parchment-muted">
              {shared.party.blurb}
            </p>
          )}
        </section>
        <div className="grid gap-4">
          {shared.party.slots.map((member, i) => (
            <SlotSection key={i} index={i} member={member} readOnly />
          ))}
        </div>
        <PublishedParties
          ownUid={user?.uid ?? null}
          currentId={party.id}
          onDeletedCurrent={() => setParty((p) => (p ? { ...p, id: undefined } : p))}
        />
      </div>
    );
  }

  // ── Planner ────────────────────────────────────────────────────────────
  return (
    <div>
      {storageBroken && (
        <p className="mb-4 font-body text-sm text-red-200">
          Saving to this browser failed — your party only lives in this tab. Copy a share link to
          keep it.
        </p>
      )}
      {linkError && (
        <p className="mb-4 font-body text-sm text-red-200">
          That party link couldn&rsquo;t be opened — it may be stale, deleted, or truncated when
          pasted.
        </p>
      )}
      {shareError && <p className="mb-4 font-body text-sm text-red-200">{shareError}</p>}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={party.name}
          onChange={(e) => setParty((p) => ({ ...(p ?? EMPTY_PARTY), name: e.target.value }))}
          placeholder="Party name (optional)"
          maxLength={60}
          className="frame w-64 max-w-full rounded bg-night-900 px-3 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={memberCount === 0 || saving || !user}
          title={user ? undefined : "Sign in to save parties to your account"}
          className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600 disabled:opacity-40"
        >
          {saving ? "Saving…" : savedFlash ? "Saved ✓" : party.id ? "Save changes" : "Save party"}
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          disabled={memberCount === 0}
          className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment disabled:opacity-40"
        >
          {copied ? "Link copied ✓" : "Copy link"}
        </button>
        {memberCount > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all three slots?")) {
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
          Drafts stay on this device; slots hold a snapshot of each build, so the party keeps
          working even if a build is later edited or deleted — swap the slot to pick up changes.{" "}
          {user
            ? "Saving publishes the party to your account (and the list below) with a short link; saving again updates it."
            : "Sign in to save parties to your account — Copy link still works signed out, the link itself carrying the whole party."}
        </span>
      </div>

      <div className="grid gap-4">
        {party.slots.map((member, i) => (
          <SlotSection
            key={i}
            index={i}
            member={member}
            readOnly={false}
            onChoose={() => setPickerSlot(i)}
            onClear={() => setSlot(i, null)}
          />
        ))}
      </div>

      <PublishedParties
        key={publishCount}
        ownUid={user?.uid ?? null}
        currentId={party.id}
        onDeletedCurrent={() => setParty((p) => (p ? { ...p, id: undefined } : p))}
      />

      {pickerSlot !== null && (
        <PartyBuildPicker
          slotIndex={pickerSlot}
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
