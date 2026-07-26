"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Two-step modal for filling a party slot: pick a player from the
//  community directory, then pick one of their synced builds. Cloud-only
//  on purpose — device-local builds are ignored, so every slot points at
//  a real community profile. The chosen build is snapshotted
//  (toSharedBuild) so the party stays intact even if the owner later
//  edits or deletes it.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Dropdown } from "@/components/Dropdown";
import { characterChalices } from "@/data/chalices";
import { listProfiles, pullCloudStore, type UserProfile } from "@/lib/cloudSync";
import { useAuth } from "@/lib/useAuth";
import { EMPTY_STORE, toSharedBuild, type Build, type BuildStore } from "@/lib/builds";
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

/** Collapsed-card style relic strip: slot icons dimmed where empty. */
function IconStrip({ build, store }: { build: Build; store: BuildStore }) {
  const relicStore = build.relics?.length
    ? { ...store, customRelics: [...store.customRelics, ...build.relics] }
    : store;
  const chalice = chalicesFor(build.character).find((c) => c.name === build.chalice);
  return (
    <span className="flex shrink-0 items-center gap-1">
      {build.slots.map((slot, i) => {
        const r = resolveSlot(slot, relicStore);
        return r ? (
          <RelicImg key={i} src={r.icon} alt={r.name} size={22} />
        ) : (
          <span key={i} className="opacity-35">
            <SlotIconImg color={chalice?.slots[i] ?? "White"} size={18} />
          </span>
        );
      })}
    </span>
  );
}

export function PartyBuildPicker({
  slotIndex,
  onPick,
  onClose,
}: {
  slotIndex: number;
  onPick: (member: PartyMember) => void;
  onClose: () => void;
}) {
  const user = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Step 1 result — null while still on the player list.
  const [owner, setOwner] = useState<{ uid: string; name: string } | null>(null);
  const [ownerStore, setOwnerStore] = useState<BuildStore | null>(null);
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

  const selectOwner = (uid: string, name: string) => {
    setOwner({ uid, name });
    setCharacter("");
    setOwnerStore(null);
    pullCloudStore(uid)
      .then((s) => setOwnerStore(s ?? EMPTY_STORE))
      .catch((err) => {
        console.error("Loading user's builds failed:", err);
        setError("Couldn't load this user's builds — try again in a moment.");
      });
  };

  const pick = (b: Build) => {
    if (!owner || !ownerStore) return;
    onPick({ uid: owner.uid, ownerName: owner.name, build: toSharedBuild(b, ownerStore) });
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
          {owner && (
            <button
              type="button"
              onClick={() => {
                setOwner(null);
                setOwnerStore(null);
              }}
              className="rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:text-parchment"
            >
              ← Players
            </button>
          )}
          <h3 className="min-w-0 truncate font-display text-lg font-semibold text-parchment">
            {owner ? `${owner.name}’s builds` : `Slot ${slotIndex + 1} — choose a player`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto rounded border border-night-600 px-2 py-0.5 font-body text-sm text-parchment-muted hover:text-parchment"
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
          ) : (
            // ── Step 2: their builds ───────────────────────────────────
            <>
              {ownerCharacters.length > 1 && (
                <div className="mb-3">
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
                </div>
              )}
              {visibleBuilds.length === 0 ? (
                <p className="font-body text-sm text-parchment-faint">
                  {character ? "No builds for this Nightfarer." : "No builds to pick from yet."}
                </p>
              ) : (
                <div className="grid gap-2">
                  {visibleBuilds.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => pick(b)}
                      className="frame flex w-full items-center gap-3 rounded-md bg-night-800 p-3 text-left transition-colors hover:bg-night-700"
                    >
                      <IconStrip build={b} store={ownerStore} />
                      <span className="min-w-0">
                        <span className="block truncate font-display font-semibold text-parchment">
                          {b.name || "Unnamed build"}
                        </span>
                        <span className="block font-body text-xs text-parchment-faint">
                          {b.character} · {b.chalice}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
