import Link from "next/link";
import { CommunityUsers } from "@/components/builds/CommunityUsers";

export default function BuildsUsersPage() {
  return (
    <div>
      <header className="mb-8 border-b border-night-600 pb-6">
        <p className="eyebrow">Nightfarers</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-parchment sm:text-4xl">
          Community
        </h2>
        <p className="mt-2 max-w-prose font-body text-parchment-muted">
          Everyone who has signed in and synced their builds. Open a profile to
          browse their loadouts — view-only, nothing joins your own collection.
        </p>
        <Link
          href="/builds"
          className="mt-3 inline-block font-body text-sm text-gold-dim hover:text-gold-bright"
        >
          ← Back to your builds
        </Link>
      </header>

      <CommunityUsers />
    </div>
  );
}
