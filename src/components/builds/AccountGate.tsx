"use client";

// ─────────────────────────────────────────────────────────────────────────
//  The states the Builds page can be in *before* there's a store to show:
//  signed out, a failed load, a load that only the local cache answered, and
//  the one-time offer of whatever this browser saved back when builds lived
//  here rather than in an account.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { signInWithGoogle } from "@/lib/cloud";
import { cloudErrorMessage } from "@/lib/cloudRead";
import { loadLegacyStore, type BuildStore } from "@/lib/builds";

const PANEL = "frame rounded-md bg-night-850 p-5";

function SignInButton({ label = "Sign in with Google" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => void signInWithGoogle()}
      className="frame rounded-md bg-night-700 px-4 py-2 font-body text-sm text-gold-bright hover:bg-night-600"
    >
      {label}
    </button>
  );
}

/** How much a store holds, for the two places that have to describe one. */
function describeStore(store: BuildStore): string {
  const parts = [
    store.builds.length > 0 && `${store.builds.length} build${store.builds.length === 1 ? "" : "s"}`,
    store.customRelics.length > 0 &&
      `${store.customRelics.length} relic${store.customRelics.length === 1 ? "" : "s"}`,
  ].filter(Boolean) as string[];
  return parts.join(" and ");
}

/**
 * What the page is instead of the builds list when nobody is signed in.
 * Builds and relics belong to an account, so there is nothing to show and
 * nothing to create until there is one.
 */
export function SignInWall() {
  // Anything left from before the change is worth naming here — otherwise
  // signing in looks like it can only cost you what's in this browser.
  const [legacy, setLegacy] = useState<BuildStore | null>(null);
  useEffect(() => setLegacy(loadLegacyStore()), []);

  return (
    <section className={PANEL}>
      <h3 className="font-display text-lg font-semibold text-parchment">Sign in to use Builds</h3>
      <p className="mt-2 max-w-prose font-body text-sm text-parchment-muted">
        Your builds and relics are saved to your account, so they follow you from
        one device to the next, survive clearing your browser, and can be shared
        from your community page.
      </p>
      <div className="mt-4">
        <SignInButton />
      </div>
      {legacy && (
        <p className="mt-4 max-w-prose font-body text-xs text-parchment-faint">
          This browser still holds {describeStore(legacy)} saved before builds moved
          to accounts. Sign in and you&rsquo;ll be asked whether to import them.
        </p>
      )}
      <p className="mt-4 max-w-prose font-body text-xs text-parchment-faint">
        Nothing from your Google account is published — the community directory
        shows a nickname you choose, and nothing else.
      </p>
    </section>
  );
}

/** The account copy couldn't be read and there's no cached copy to show. */
export function LoadFailed({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <section className={PANEL} style={{ borderColor: "rgb(248 113 113 / 0.6)" }}>
      <h3 className="font-display text-lg font-semibold text-parchment">
        Couldn&rsquo;t load your builds
      </h3>
      <p className="mt-2 max-w-prose font-body text-sm text-red-200">
        {cloudErrorMessage(error, "your builds")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 frame rounded-md bg-night-700 px-4 py-2 font-body text-sm text-gold-bright hover:bg-night-600"
      >
        Try again
      </button>
    </section>
  );
}

/**
 * Shown above the page when the account copy is unreachable and what's on
 * screen came out of the local cache. Editing stays open — the changes go to
 * the cache and are merged up the next time a load succeeds — so the banner's
 * job is to be clear that nothing has reached the account yet.
 */
export function OfflineBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="frame mb-5 rounded-md bg-night-850 p-4" style={{ borderColor: "rgb(248 113 113 / 0.6)" }}>
      <p className="font-body text-sm text-red-200">
        Can&rsquo;t reach your account — this is the copy last saved in this browser.
      </p>
      <p className="mt-1 font-body text-xs text-parchment-faint">
        You can keep working: changes are kept here and sync to your account the
        next time it loads. Don&rsquo;t clear this browser&rsquo;s storage until they do.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
      >
        Try again
      </button>
    </section>
  );
}

/**
 * Syncing stopped itself after writing in a loop (see useAccountStore's
 * PUSH_LIMIT). Says what to do about it, since the cause is nearly always
 * another tab or device on the same account rather than anything on this one.
 */
export function RunawayBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="frame mb-5 rounded-md bg-night-850 p-4" style={{ borderColor: "rgb(248 113 113 / 0.6)" }}>
      <p className="font-body text-base text-red-200">
        Saving to your account has been paused — it was saving over and over.
      </p>
      <p className="mt-1 max-w-prose font-body text-sm text-parchment-faint">
        This usually means another tab or device is signed in to this account and
        the two are overwriting each other. Close the others, then resume. Your
        edits are safe in this browser in the meantime — but don&rsquo;t clear its
        storage until saving is back.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
      >
        Resume saving
      </button>
    </section>
  );
}

/**
 * Dev servers read the real database and don't write to it (see
 * CLOUD_READONLY). Never rendered by a deployed build.
 */
export function DevReadOnlyBanner() {
  return (
    <section className="frame mb-5 rounded-md bg-night-850 p-4" style={{ borderColor: "rgb(250 204 21 / 0.5)" }}>
      <p className="font-body text-base text-gold-bright">
        Dev server: your account is read-only here.
      </p>
      <p className="mt-1 max-w-prose font-body text-sm text-parchment-faint">
        Edits stay in this browser and never reach the real database, so a
        half-finished migration can&rsquo;t land in a live account. Run{" "}
        <code className="font-mono">npm run dev:fake</code> for a writable stub
        backend, or set <code className="font-mono">NEXT_PUBLIC_REAL_CLOUD=1</code> to
        write for real.
      </p>
    </section>
  );
}

/**
 * The one-time offer of the pre-account store. Asked rather than merged
 * silently: on a shared or borrowed browser those builds may well be someone
 * else's, and an account is the one place they'd be awkward to unpick from.
 */
export function LegacyImportCard({
  legacy,
  onImport,
  onDismiss,
}: {
  legacy: BuildStore;
  onImport: () => void;
  onDismiss: () => void;
}) {
  return (
    <section className="frame mb-5 rounded-md bg-night-850 p-4" style={{ borderColor: "rgb(212 175 55 / 0.5)" }}>
      <p className="font-body text-sm text-parchment">
        This browser has {describeStore(legacy)} saved before builds moved to
        accounts. Add them to your account?
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onImport}
          className="frame rounded-md bg-night-700 px-3 py-1.5 font-body text-sm text-gold-bright hover:bg-night-600"
        >
          Import them
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="frame rounded-md bg-night-800 px-3 py-1.5 font-body text-sm text-parchment-muted hover:bg-night-700 hover:text-parchment"
        >
          No thanks
        </button>
        <span className="font-body text-xs text-parchment-faint">
          Turning this down leaves them in the browser, untouched — it just stops asking.
        </span>
      </div>
    </section>
  );
}
