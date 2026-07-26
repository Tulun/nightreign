import { Suspense } from "react";
import Link from "next/link";
import { PartyPlanner } from "@/components/builds/PartyPlanner";

export default function PartyPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Nightfarers</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Party Planner
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Assemble a three-Nightfarer expedition. Fill each slot with a build —
          yours or anyone&rsquo;s from Community Builds — then share the whole
          party with a single link, or browse the parties others have published.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          <Link
            href="/builds"
            className="font-body text-sm text-gold-dim hover:text-gold-bright"
          >
            ← Back to your builds
          </Link>
          <Link
            href="/builds/users"
            className="font-body text-sm text-gold-dim hover:text-gold-bright"
          >
            Community Builds →
          </Link>
        </div>
      </header>

      {/* useSearchParams (the ?id= published-party link) requires a Suspense
          boundary to statically export. */}
      <Suspense fallback={<p className="font-body text-sm text-parchment-faint">Loading party…</p>}>
        <PartyPlanner />
      </Suspense>
    </div>
  );
}
