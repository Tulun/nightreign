import { Suspense } from "react";
import Link from "next/link";
import { PartiesDirectory } from "@/components/builds/PartiesDirectory";

export default function PartiesPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Nightfarers</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Parties
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Three-Nightfarer expeditions assembled from community builds. Browse
          what others have published, open one from a share link, or create
          your own in the planner.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          <Link
            href="/builds"
            className="font-body py-1 text-base text-gold-dim hover:text-gold-bright"
          >
            ← Back to your builds
          </Link>
          <Link
            href="/builds/users"
            className="font-body py-1 text-base text-gold-dim hover:text-gold-bright"
          >
            Community Builds →
          </Link>
        </div>
      </header>

      {/* useSearchParams (the ?id= published-party link) requires a Suspense
          boundary to statically export. */}
      <Suspense fallback={<p className="font-body text-sm text-parchment-faint">Loading parties…</p>}>
        <PartiesDirectory />
      </Suspense>
    </div>
  );
}
