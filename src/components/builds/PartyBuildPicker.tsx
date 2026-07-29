"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Modal for filling a party slot, in up to three steps: pick a player,
//  pick one of their synced builds, and — when that build carries variants
//  — pick which loadout the slot runs. Cloud-only on purpose: device-local
//  builds are ignored, so every slot points at a real community profile.
//  What lands in the slot is a snapshot (toSharedBuild) of the chosen
//  loadout, so the party stays intact even if the owner later edits or
//  deletes the build.
//
//  Swapping a filled slot opens straight on its current player, with the
//  build and variant it holds marked — the player dropdown re-picks someone
//  else without a trip back to the list.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Dropdown } from "@/components/Dropdown";
import { characterChalices } from "@/data/chalices";
import { listProfiles, pullCloudStore, useAuth, type UserProfile } from "@/lib/cloud";
import {
  EMPTY_STORE,
  clampStore,
  toSharedBuild,
  variantAt,
  variantCount,
  variantLabel,
  type Build,
  type BuildStore,
  type VariantView,
} from "@/lib/builds";
import type { SlotColor } from "@/lib/chalices";
import type { PartyMember } from "@/lib/party";
import { resolveSlot, RelicImg, SlotIconImg, chalicesFor } from "./shared";

/** Initial-letter tile, same idea as the community directory's. */
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

/** "in this slot" marker on the build/variant the slot already holds. */
function CurrentChip() {
  return (
    <span className="rounded border border-gold-faint px-1.5 py-0.5 font-body text-[0.65rem] uppercase tracking-wide text-gold-dim">
      in this slot
    </span>
  );
}

/**
 * Collapsed-card style relic strip: slot icons dimmed where empty, with the
 * Deep of Night set after a divider where the loadout fills any — two
 * variants of one build often differ only there, and a strip that stopped at
 * the normal slots would show them as the same three relics twice.
 */
function IconStrip({
  character,
  loadout,
  store,
}: {
  character: string;
  loadout: VariantView;
  store: BuildStore;
}) {
  const chalice = chalicesFor(character).find((c) => c.name === loadout.chalice);
  const hasDeep = loadout.deepSlots.some(Boolean);
  const strip = (slots: VariantView["slots"], colors: (SlotColor | undefined)[], deep: boolean) =>
    slots.map((slot, i) => {
      const r = resolveSlot(slot, store);
      return r ? (
        <span key={i} className={deep ? "opacity-70" : undefined}>
          <RelicImg src={r.icon} alt={deep ? `${r.name} (Deep of Night)` : r.name} size={22} />
        </span>
      ) : (
        <span key={i} className="opacity-35">
          <SlotIconImg color={colors[i] ?? "White"} size={18} />
        </span>
      );
    });
  return (
    <span className="flex shrink-0 items-center gap-1">
      {strip(loadout.slots, chalice?.slots ?? [], false)}
      {hasDeep && (
        <>
          <span className="mx-1 h-5 w-px bg-night-600" aria-hidden="true" />
          {strip(loadout.deepSlots, chalice?.deep ?? [], true)}
        </>
      )}
    </span>
  );
}

export function PartyBuildPicker({
  slotIndex,
  current,
  onlyUid,
  onPick,
  onReserve,
  onClose,
}: {
  slotIndex: number;
  /** What the slot holds now (swap), or null when filling an empty slot. */
  current?: PartyMember | null;
  /**
   * Pin the picker to one player, skipping the player step: someone editing
   * their own slot of another's party fills it from their builds or not at
   * all. (The rules can't enforce that — a slot's contents are opaque JSON to
   * them — so this is the UI keeping the promise the mode makes.)
   */
  onlyUid?: string;
  onPick: (member: PartyMember) => void;
  /**
   * Put a player in the slot without a build, leaving that to them. Offered
   * to whoever can hand a slot out (the party's owner); absent when the
   * picker is being used to fill your own slot, where reserving it from
   * yourself would mean nothing.
   */
  onReserve?: (member: PartyMember) => void;
  onClose: () => void;
}) {
  const user = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Step 1 result — null while still on the player list. A swap starts on
  // the member's own player, so the common case is one click, not three.
  const [owner, setOwner] = useState<{ uid: string; name: string } | null>(
    current?.uid
      ? { uid: current.uid, name: current.ownerName }
      : onlyUid
        ? { uid: onlyUid, name: "" }
        : null,
  );
  const [ownerStore, setOwnerStore] = useState<BuildStore | null>(null);
  // Step 2 result — the build whose loadouts step 3 is choosing between.
  const [pending, setPending] = useState<Build | null>(null);
  const [q, setQ] = useState("");
  const [character, setCharacter] = useState("");

  useEffect(() => {
    let cancelled = false;
    listProfiles()
      .then((p) => !cancelled && setProfiles(p))
      .catch((err) => {
        console.error("Loading user directory failed:", err);
        if (!cancelled) setError("Couldn't load the user directory — try again in a moment.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The selected player's builds, refetched whenever the player changes
  // (including the seeded one a swap opens on).
  useEffect(() => {
    if (!owner) return;
    let cancelled = false;
    setOwnerStore(null);
    pullCloudStore(owner.uid)
      // Someone else's builds, about to be listed here — clamped for display
      // only. Nothing writes this copy back, so trimming it costs them
      // nothing; toSharedBuild clamps again for whatever lands in the slot.
      .then((s) => !cancelled && setOwnerStore(s ? clampStore(s) : EMPTY_STORE))
      .catch((err) => {
        console.error("Loading user's builds failed:", err);
        if (!cancelled) setError("Couldn't load this user's builds — try again in a moment.");
      });
    return () => {
      cancelled = true;
    };
  }, [owner]);

  const selectOwner = (uid: string, name: string) => {
    if (uid === owner?.uid) return;
    setError(null);
    setCharacter("");
    setPending(null);
    setOwner({ uid, name });
  };

  const pick = (b: Build, variantIdx: number) => {
    if (!owner || !ownerStore) return;
    onPick({
      uid: owner.uid,
      ownerName: ownerName || "Player",
      buildId: b.id,
      // Only a build with variants has a loadout worth naming.
      ...(variantCount(b) > 1 ? { variantLabel: variantLabel(b, variantIdx) } : {}),
      build: toSharedBuild(b, ownerStore, variantIdx),
    });
  };

  /** Choosing a build: straight into the slot, or on to its loadouts. */
  const chooseBuild = (b: Build) => {
    if (variantCount(b) > 1) setPending(b);
    else pick(b, 0);
  };

  /** Hand the slot to this player with nothing in it yet. */
  const reserve = () => {
    if (!owner || !onReserve) return;
    onReserve({ uid: owner.uid, ownerName: ownerName || "Player" });
  };

  const filteredProfiles = (profiles ?? []).filter(
    (p) => !q.trim() || p.displayName.toLowerCase().includes(q.trim().toLowerCase()),
  );

  // Step 2 list: only what the player's community profile shows.
  const visibleBuilds =
    owner && ownerStore
      ? ownerStore.builds
          .filter((b) => b.public !== false)
          .filter((b) => !character || b.character === character)
          .sort((a, b) => b.updatedAt - a.updatedAt)
      : [];
  const ownerCharacters = characterChalices
    .map((c) => ({
      name: c.name,
      count: (ownerStore?.builds ?? []).filter(
        (b) => b.character === c.name && b.public !== false,
      ).length,
    }))
    .filter((c) => c.count > 0);

  // Which build/variant the slot holds now, so the lists can mark it.
  const isCurrentBuild = (b: Build) => !!current?.buildId && current.buildId === b.id && current.uid === owner?.uid;
  const isCurrentVariant = (b: Build, i: number) =>
    isCurrentBuild(b) && (current?.variantLabel ?? variantLabel(b, 0)) === variantLabel(b, i);

  // A pinned player is seeded from a uid alone, so their name comes from the
  // directory once it lands.
  const ownerName = owner
    ? owner.name || profiles?.find((p) => p.uid === owner.uid)?.displayName || ""
    : "";

  const title = pending
    ? `${pending.name || "Unnamed build"} — choose a loadout`
    : owner
      ? ownerName
        ? `${ownerName}’s builds`
        : "Your builds"
      : `Slot ${slotIndex + 1} — choose a player`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Choose a build for slot ${slotIndex + 1}`}
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-night-500 bg-night-850 shadow-lift"
      >
        <div className="flex items-center gap-2 border-b border-night-600 px-4 py-3">
          {(pending || (owner && !onlyUid)) && (
            <button
              type="button"
              onClick={() => {
                if (pending) setPending(null);
                else {
                  setOwner(null);
                  setOwnerStore(null);
                  setError(null);
                }
              }}
              className="shrink-0 rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:text-parchment"
            >
              {pending ? "← Builds" : "← Players"}
            </button>
          )}
          <h3 className="min-w-0 truncate font-display text-lg font-semibold text-parchment">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto shrink-0 rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:text-parchment"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {error ? (
            <p className="font-body text-sm text-red-200">{error}</p>
          ) : !owner ? (
            // ── Step 1: player list ────────────────────────────────────
            <>
              <input
                type="text"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search players…"
                className="frame mb-3 w-full rounded bg-night-900 px-3 py-1.5 font-body text-sm text-parchment placeholder:text-parchment-faint focus:outline-none"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {!profiles ? (
                  <p className="font-body text-sm text-parchment-faint">Loading players…</p>
                ) : (
                  filteredProfiles.map((p) => (
                    <button
                      key={p.uid}
                      type="button"
                      onClick={() => selectOwner(p.uid, p.displayName)}
                      className="frame flex items-center gap-3 rounded-md bg-night-800 p-3 text-left transition-colors hover:bg-night-700"
                    >
                      <Avatar name={p.displayName} size={36} />
                      <span className="min-w-0">
                        <span className="block truncate font-display font-semibold text-parchment">
                          {p.displayName}
                          {p.uid === user?.uid && (
                            <span className="ml-1.5 font-body text-xs font-normal text-gold-dim">
                              you
                            </span>
                          )}
                        </span>
                        <span className="block font-body text-xs text-parchment-faint">
                          {p.buildCount} {p.buildCount === 1 ? "build" : "builds"}
                          {p.uid === current?.uid && " · in this slot"}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
              {profiles && filteredProfiles.length === 0 && (
                <p className="mt-3 font-body text-sm text-parchment-faint">No players found.</p>
              )}
            </>
          ) : !ownerStore ? (
            <p className="font-body text-sm text-parchment-faint">Loading builds…</p>
          ) : pending ? (
            // ── Step 3: which loadout of that build ────────────────────
            <>
              <p className="mb-3 font-body text-sm text-parchment-muted">
                {pending.character} · this build has {variantCount(pending)} loadouts — the slot
                takes one of them.
              </p>
              <div className="grid gap-2">
                {Array.from({ length: variantCount(pending) }, (_, i) => {
                  const loadout = variantAt(pending, i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => pick(pending, i)}
                      className="frame flex w-full items-center gap-3 rounded-md bg-night-800 p-3 text-left transition-colors hover:bg-night-700"
                    >
                      <IconStrip
                        character={pending.character}
                        loadout={loadout}
                        store={relicStoreFor(pending, ownerStore)}
                      />
                      <span className="min-w-0">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-display font-semibold text-parchment">
                            {variantLabel(pending, i)}
                          </span>
                          {isCurrentVariant(pending, i) && <CurrentChip />}
                        </span>
                        <span className="block truncate font-body text-xs text-parchment-faint">
                          {loadout.chalice}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            // ── Step 2: their builds ───────────────────────────────────
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {/* Swapping the player without stepping back — the whole
                    directory is right here. */}
                {(profiles?.length ?? 0) > 1 && (
                  <Dropdown
                    value={owner.uid}
                    onChange={(uid) => {
                      const p = profiles?.find((x) => x.uid === uid);
                      if (p) selectOwner(p.uid, p.displayName);
                    }}
                    clearable={false}
                    searchable={(profiles?.length ?? 0) > 8}
                    options={(profiles ?? []).map((p) => ({
                      value: p.uid,
                      label: `${p.displayName}${p.uid === user?.uid ? " (you)" : ""}`,
                    }))}
                    className="w-52"
                  />
                )}
                {ownerCharacters.length > 1 && (
                  <Dropdown
                    value={character}
                    onChange={setCharacter}
                    placeholder="All Nightfarers"
                    options={ownerCharacters.map((c) => ({
                      value: c.name,
                      label: `${c.name} (${c.count})`,
                    }))}
                    className="w-52"
                  />
                )}
              </div>
              {/* Save the slot for them and let them bring the build. The
                  point of the whole thing when they haven't decided yet — or
                  haven't synced a build at all. */}
              {onReserve && (
                <button
                  type="button"
                  onClick={reserve}
                  className="frame mb-3 flex w-full items-center gap-3 rounded-md border border-dashed border-gold-faint bg-night-800 p-3 text-left transition-colors hover:bg-night-700"
                >
                  <Avatar name={ownerName || "?"} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate font-display font-semibold text-gold-bright">
                      Save this slot for {ownerName || "them"}
                    </span>
                    <span className="block font-body text-xs text-parchment-faint">
                      They pick their own build — you don&rsquo;t have to choose one for them.
                    </span>
                  </span>
                </button>
              )}
              {visibleBuilds.length === 0 ? (
                <p className="font-body text-sm text-parchment-faint">
                  {character ? "No builds for this Nightfarer." : "No builds to pick from yet."}
                </p>
              ) : (
                <div className="grid gap-2">
                  {visibleBuilds.map((b) => {
                    const variants = variantCount(b);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => chooseBuild(b)}
                        className="frame flex w-full items-center gap-3 rounded-md bg-night-800 p-3 text-left transition-colors hover:bg-night-700"
                      >
                        <IconStrip
                          character={b.character}
                          loadout={variantAt(b, 0)}
                          store={relicStoreFor(b, ownerStore)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-display font-semibold text-parchment">
                              {b.name || "Unnamed build"}
                            </span>
                            {isCurrentBuild(b) && <CurrentChip />}
                          </span>
                          <span className="block truncate font-body text-xs text-parchment-faint">
                            {b.character} · {b.chalice}
                            {variants > 1 && ` · ${variants} loadouts`}
                          </span>
                        </span>
                        {variants > 1 && (
                          <span className="shrink-0 font-body text-xs text-gold-dim">
                            choose loadout →
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** The pool a build's slots resolve against (its own relics win, as ever). */
function relicStoreFor(build: Build, store: BuildStore): BuildStore {
  return build.relics?.length
    ? { ...store, customRelics: [...store.customRelics, ...build.relics] }
    : store;
}
