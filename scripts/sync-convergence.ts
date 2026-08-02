// ─────────────────────────────────────────────────────────────────────────
//  Convergence harness for the cloud sync — answers open question #2 of
//  docs/firestore-quota-2026-07-30.md: can two tabs on the SAME code loop
//  forever, with preferLocalRelics suspected as the mechanism?
//
//  Three layers, all over seeded random stores built to fight (shared relic
//  ids with different content, equal-updatedAt build clashes, tombstones
//  racing edits, alias-spelled effect strings):
//
//    1. normalize fixpoint — normalizeStore(JSON round trip) must be
//       idempotent, or a single tab ping-pongs with its own echo.
//    2. merge algebra — merge(a, merge(b, a)) must be a fixpoint, in both
//       flag positions.
//    3. protocol simulation — two simulated tabs running useAccountStore's
//       exact listener + debounced-push logic against a serialized cloud
//       doc, with randomized event ordering and snapshot coalescing. A
//       trial that exceeds the push budget is a reproduced runaway.
//
//  Usage:  npx tsx scripts/sync-convergence.ts [trials] [seed]
// ─────────────────────────────────────────────────────────────────────────

import { mergeWithCloud } from "@/lib/cloudSync";
import { EFFECT_VOCABULARY } from "@/lib/effectMatch";
import {
  normalizeStore,
  tagTombstone,
  type Build,
  type BuildStore,
  type CustomRelic,
} from "@/lib/builds";

const TRIALS = Number(process.argv[2] ?? 500);
const SEED = Number(process.argv[3] ?? 1);

// storeKey, copied verbatim from useAccountStore.ts (it isn't exported —
// keep in sync by hand).
function storeKey(store: BuildStore | null): string | null {
  if (!store) return null;
  const byId = <T extends { id: string }>(xs: T[]) =>
    [...xs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const canonical = { ...store, builds: byId(store.builds), customRelics: byId(store.customRelics) };
  return JSON.stringify(canonical, (_k, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1)),
        )
      : v,
  );
}

// ── Seeded PRNG ──────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rng = () => number;
const pick = <T,>(rng: Rng, xs: T[]): T => xs[Math.floor(rng() * xs.length)];
const chance = (rng: Rng, p: number) => rng() < p;

// ── Store generator ──────────────────────────────────────────────────────
// Effect strings: canonical names plus the alias spellings gameRelicLines
// exists to rewrite — colon character tags, "&"→"and", "+0" tiers, spelled
// out statuses — plus junk that matches nothing.
function effectPool(): string[] {
  const canon = EFFECT_VOCABULARY.filter((_, i) => i % 7 === 0); // a spread, not all 1000+
  const aliased = canon.flatMap((n) => {
    const out: string[] = [];
    const tag = n.match(/^\[([A-Za-z]+)\] (.+)$/);
    if (tag) out.push(`${tag[1]}: ${tag[2]}`);
    if (n.includes(" & ")) out.push(n.replace(/ & /g, " and "));
    if (/\bRot\b/.test(n)) out.push(n.replace(/\bRot\b/, "Scarlet Rot"));
    if (/\bFrost\b/.test(n)) out.push(n.replace(/\bFrost\b/, "Frostbite"));
    if (!/ \+\d$/.test(n)) out.push(`${n} +0`);
    return out;
  });
  return [...canon, ...aliased, "utter junk line", "Improved Nonsense +9"];
}
const EFFECTS = effectPool();

const RELIC_IDS = ["r1", "r2", "r3"];
const BUILD_IDS = ["b1", "b2", "b3"];
const TAGS = ["pve", "boss", "farm"];
const TIMES = [1000, 2000, 3000]; // small set to force updatedAt ties
const NOW = Date.now();

function genRelic(rng: Rng, id: string): CustomRelic {
  return {
    id,
    name: chance(rng, 0.5) ? `Relic ${id}` : "",
    color: pick(rng, ["Red", "Blue", "Green", "Yellow"] as const),
    effects: Array.from({ length: 1 + Math.floor(rng() * 3) }, () => pick(rng, EFFECTS)),
    ...(chance(rng, 0.7) ? { demerits: [] } : {}),
    ...(chance(rng, 0.5) ? { deep: chance(rng, 0.5) } : {}),
    ...(chance(rng, 0.3) ? { tags: [pick(rng, TAGS)] } : {}),
  } as CustomRelic;
}

function genBuild(rng: Rng, id: string): Build {
  return {
    id,
    name: `Build ${id} v${Math.floor(rng() * 100)}`,
    character: "Wylder",
    chalice: null,
    slots: [null, null, null],
    deepSlots: [null, null, null],
    updatedAt: NOW - pick(rng, TIMES),
    ...(chance(rng, 0.4) ? { tags: [pick(rng, TAGS)] } : {}),
  } as unknown as Build;
}

function genStore(rng: Rng): BuildStore {
  const deleted: Record<string, number> = {};
  if (chance(rng, 0.4)) deleted[pick(rng, [...RELIC_IDS, ...BUILD_IDS])] = NOW - pick(rng, TIMES);
  if (chance(rng, 0.3)) deleted[tagTombstone(pick(rng, TAGS))] = NOW - pick(rng, TIMES);
  const raw = {
    version: 3 as const,
    builds: BUILD_IDS.filter(() => chance(rng, 0.7)).map((id) => genBuild(rng, id)),
    customRelics: RELIC_IDS.filter(() => chance(rng, 0.8)).map((id) => genRelic(rng, id)),
    tags: TAGS.filter(() => chance(rng, 0.5)),
    relicTags: [],
    deleted,
  };
  // Everything real enters through normalizeStore (load, import, snapshot),
  // so trials start from what the app would actually hold.
  const norm = normalizeStore(JSON.parse(JSON.stringify(raw)));
  if (!norm) throw new Error("generator produced an unusable store");
  return norm;
}

// ── Layer 1+2: fixpoint and algebra checks ───────────────────────────────
let failures = 0;
function fail(what: string, detail: unknown) {
  failures++;
  console.error(`FAIL ${what}`);
  console.error(JSON.stringify(detail, null, 2).slice(0, 2000));
}

function checkAlgebra(rng: Rng, trial: number) {
  const a = genStore(rng);
  const b = genStore(rng);
  const roundTrip = (s: BuildStore) => normalizeStore(JSON.parse(JSON.stringify(s)))!;
  if (storeKey(roundTrip(a)) !== storeKey(a)) {
    return fail(`normalize fixpoint (trial ${trial})`, { a, twice: roundTrip(a) });
  }
  if (storeKey(mergeWithCloud(a, a)) !== storeKey(a)) {
    return fail(`merge idempotence (trial ${trial})`, { a });
  }
  for (const flag of [false, true]) {
    const m = mergeWithCloud(b, a, flag); // b local, a cloud
    // The doc's property: merge(a, merge(b, a)) reaches a fixpoint — i.e.
    // once one side has pushed a merge, the other side's merge of it (with
    // no local edits, so flag false) must accept it verbatim.
    const m2 = mergeWithCloud(a, m, false);
    const m3 = mergeWithCloud(m2, m, false);
    if (storeKey(m3) !== storeKey(m2)) {
      return fail(`merge fixpoint flag=${flag} (trial ${trial})`, { a, b, m, m2, m3 });
    }
    // And the pushed merge must round-trip the wire unchanged, or the
    // pusher rejects its own echo.
    if (storeKey(roundTrip(m)) !== storeKey(m)) {
      return fail(`merged store normalize fixpoint flag=${flag} (trial ${trial})`, { m });
    }
  }
}

/** Paths where two parsed stores differ — the shape of an oscillation. */
function diffStores(a: unknown, b: unknown, path = ""): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) {
    return [`${path}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`];
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return Array.from(keys).flatMap((k) =>
    diffStores(
      (a as Record<string, unknown>)[k],
      (b as Record<string, unknown>)[k],
      path ? `${path}.${k}` : k,
    ),
  );
}

// ── Layer 3: protocol simulation ─────────────────────────────────────────
//  Mirrors useAccountStore exactly:
//   listener  — skip own echo by cloudJson === lastPushed; merge with
//               preferLocalRelics = (localJson !== lastPushed); accept
//               (lastPushed = mergedJson) when merged == cloud, else null
//               lastPushed to force a push.
//   push      — fires when storeKey(local) !== lastPushed; writes
//               JSON.stringify(local); ack sets lastPushed.
//   wire      — a snapshot delivers normalizeStore(JSON.parse(raw)), and
//               deliveries may coalesce to the newest write.
interface Tab {
  name: string;
  local: BuildStore;
  lastPushed: string | null;
  inbox: string[]; // raw cloud doc contents, in write order
  pushes: number;
}

function deliver(tab: Tab) {
  const raw = tab.inbox.shift();
  if (raw === undefined) return;
  const cloud = normalizeStore(JSON.parse(raw));
  if (!cloud) return;
  const localJson = storeKey(tab.local);
  const cloudJson = storeKey(cloud);
  if (cloudJson === tab.lastPushed) return;
  const merged = mergeWithCloud(tab.local, cloud, localJson !== tab.lastPushed);
  const mergedJson = storeKey(merged);
  if (mergedJson === cloudJson) {
    tab.lastPushed = mergedJson;
  } else {
    tab.lastPushed = null;
  }
  if (mergedJson !== localJson) tab.local = merged;
}

function simulate(rng: Rng, trial: number): void {
  const cloudStart = genStore(rng);
  const cloudStartJson = storeKey(cloudStart);
  // Each tab: loaded the cloud copy, then made local edits it hasn't pushed
  // (the preferLocalRelics precondition). Edits overlap on relic ids.
  const mkTab = (name: string): Tab => {
    const local = mergeWithCloud(genStore(rng), cloudStart, chance(rng, 0.5));
    return { name, local, lastPushed: cloudStartJson, inbox: [], pushes: 0 };
  };
  const tabs = [mkTab("A"), mkTab("B")];
  let cloudRaw = JSON.stringify(cloudStart);
  let writes = 0;
  const writeLog: { by: string; raw: string }[] = [];

  const dirty = (t: Tab) => storeKey(t.local) !== t.lastPushed;
  const BUDGET = 60;

  for (let step = 0; step < 5000; step++) {
    const acts: (() => void)[] = [];
    for (const t of tabs) {
      if (t.inbox.length > 0) {
        acts.push(() => {
          // onSnapshot may coalesce rapid writes into the newest one.
          if (t.inbox.length > 1 && chance(rng, 0.5)) t.inbox = [t.inbox[t.inbox.length - 1]];
          deliver(t);
        });
      }
      if (dirty(t)) {
        acts.push(() => {
          t.pushes++;
          writes++;
          cloudRaw = JSON.stringify(t.local);
          writeLog.push({ by: t.name, raw: cloudRaw });
          t.lastPushed = storeKey(t.local);
          for (const other of tabs) other.inbox.push(cloudRaw);
        });
      }
    }
    if (acts.length === 0) break; // quiescent: nothing dirty, nothing in flight
    pick(rng, acts)();
    if (writes > BUDGET) {
      const last = writeLog.slice(-4).map((w) => ({ by: w.by, key: storeKey(JSON.parse(w.raw)) }));
      return fail(`protocol runaway (trial ${trial})`, {
        writes,
        distinctRecentWrites: new Set(writeLog.slice(-20).map((w) => w.raw)).size,
        diff: diffStores(JSON.parse(writeLog[writeLog.length - 2].raw), JSON.parse(writeLog[writeLog.length - 1].raw)),
        by: last.map((w) => w.by).join(","),
      });
    }
  }

  // Quiescent — but did they actually converge on the cloud copy?
  const cloudFinal = storeKey(normalizeStore(JSON.parse(cloudRaw)));
  for (const t of tabs) {
    if (storeKey(t.local) !== cloudFinal) {
      return fail(`quiescent but diverged (trial ${trial})`, {
        cloud: JSON.parse(cloudRaw),
        tab: t.name,
        local: t.local,
      });
    }
  }
}

// ── Run ──────────────────────────────────────────────────────────────────
const rng = mulberry32(SEED);
let maxWrites = 0;
for (let i = 0; i < TRIALS; i++) {
  checkAlgebra(rng, i);
  simulate(rng, i);
  if (failures > 5) break;
}
console.log(
  failures === 0
    ? `OK — ${TRIALS} trials (seed ${SEED}): normalize fixpoint, merge algebra, and two-tab protocol all converged`
    : `${failures} FAILURES over ${TRIALS} trials (seed ${SEED})`,
);
process.exit(failures === 0 ? 0 : 1);
