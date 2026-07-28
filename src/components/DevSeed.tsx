"use client";

// ─────────────────────────────────────────────────────────────────────────
//  Mounted in the root layout so any page can be reached pre-populated. Both
//  parameters need the stub backend (npm run dev:fake) — builds belong to an
//  account, and the stub's is the only one a fixture may touch:
//
//    /builds?seed=demo    load the sample builds + relics, signed in
//    /builds?seed=empty   an account with nothing in it
//
//    ?cloud=reset         back to the fixture accounts, signed out
//    ?cloud=signin        sign in as the fixture account
//    ?cloud=empty         a directory with nobody in it
//    ?cloud=timeout       every cloud read fails (also: denied, unavailable)
//
//  Seeding resets the stub first, so ?seed=demo lands you somewhere known:
//  the fixture accounts, plus your own account holding the seed.
//
//  Nothing happens without the parameter, and nothing happens off localhost
//  (see lib/devSeed). The fixture is imported dynamically so it stays out of
//  the bundle everyone else downloads.
//
//  On success the page reloads with the parameter stripped — leaving it in
//  the URL would re-seed on every navigation. A refusal is rendered as a
//  corner notice: silent no-ops are the one outcome a debugging aid can't
//  afford.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { FAKE_CLOUD } from "@/lib/cloud";
import { CLOUD_PARAM, DEV_SEED_PARAM, devSeedAllowed, prepareSeed } from "@/lib/devSeed";

const SCENARIOS = ["full", "empty", "timeout", "denied", "unavailable"];

/**
 * Drive the stub backend from the URL. Dynamically imported so the stub
 * stays out of any build that isn't running it.
 */
async function applyCloudCommand(cmd: string | null): Promise<string | null> {
  if (!cmd) return null;
  const fake = await import("@/lib/fakeCloud");
  if (cmd === "reset") fake.resetFakeCloud();
  else if (cmd === "signin") await fake.signInWithGoogle();
  else if (cmd === "signout") await fake.signOutUser();
  else if (SCENARIOS.includes(cmd)) fake.setScenario(cmd as Parameters<typeof fake.setScenario>[0]);
  else {
    return `Unknown ?cloud=${cmd}. Try: reset, signin, signout, ${SCENARIOS.join(", ")}.`;
  }
  return null;
}

export function DevSeed() {
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get(DEV_SEED_PARAM);
    const cloud = params.get(CLOUD_PARAM);
    if (!name && !cloud) return;
    if (!devSeedAllowed()) return; // deployed site: the parameters mean nothing

    let cancelled = false;
    void (async () => {
      if (!FAKE_CLOUD) {
        setProblem(
          `?${name ? DEV_SEED_PARAM : CLOUD_PARAM}= needs the stub backend — start the dev ` +
            "server with npm run dev:fake.",
        );
        return;
      }

      if (name) {
        const { devSeeds, devSeedNames } = await import("@/data/devSeeds");
        if (cancelled) return;
        const fixture = devSeeds[name];
        if (!fixture) {
          setProblem(`No seed named "${name}". Available: ${devSeedNames.join(", ")}.`);
          return;
        }
        const result = prepareSeed(name, fixture);
        if (!result.ok) {
          setProblem(result.reason);
          return;
        }
        const fake = await import("@/lib/fakeCloud");
        if (cancelled) return;
        // Reset first: a reseed without it leaves the stub holding pushes
        // from the store that was just thrown away.
        fake.resetFakeCloud();
        await fake.seedAccount(result.store);
        if (cancelled) return;
      }

      const issue = await applyCloudCommand(cloud);
      if (cancelled) return;
      if (issue) {
        setProblem(issue);
        return;
      }

      const url = new URL(window.location.href);
      url.searchParams.delete(DEV_SEED_PARAM);
      url.searchParams.delete(CLOUD_PARAM);
      window.location.replace(url.toString());
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!problem) return null;
  return (
    <div
      role="status"
      className="fixed bottom-3 left-3 z-50 max-w-sm rounded border border-red-500/50 bg-black/90 px-3 py-2 text-sm text-red-200 shadow-lg"
    >
      <span className="font-semibold">Seed not loaded — </span>
      {problem}
      <button
        type="button"
        onClick={() => setProblem(null)}
        className="ml-2 underline underline-offset-2 opacity-70 hover:opacity-100"
      >
        dismiss
      </button>
    </div>
  );
}
