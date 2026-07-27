// ─────────────────────────────────────────────────────────────────────────
//  Timeouts + human-readable failures for Firestore reads.
//
//  Firestore's getDoc/getDocs retry a broken connection forever: when the
//  client can't reach firestore.googleapis.com at all (ad/privacy blocker,
//  a school or office network, a VPN, a strict-privacy browser mode) the
//  promise never resolves AND never rejects. Anything awaiting it sits on
//  its "Loading…" state indefinitely with nothing in the console, which is
//  exactly what a visitor reports as "the page hangs". Racing every public
//  read against a deadline turns that silent hang into an error we can
//  explain and offer a retry for.
// ─────────────────────────────────────────────────────────────────────────

/** How long a read may take before we call it unreachable. */
const READ_TIMEOUT_MS = 12_000;

export type CloudErrorKind =
  /** Deadline hit — almost always the connection being blocked outright. */
  | "timeout"
  /** Backend reachable but refusing/failing the request. */
  | "unavailable"
  /** Security rules rejected the read. */
  | "denied"
  | "unknown";

export class CloudReadError extends Error {
  constructor(
    readonly kind: CloudErrorKind,
    override readonly cause?: unknown,
  ) {
    super(`cloud read failed: ${kind}`);
    this.name = "CloudReadError";
  }
}

function kindOf(err: unknown): CloudErrorKind {
  const code = (err as { code?: string } | null)?.code;
  if (code === "permission-denied" || code === "unauthenticated") return "denied";
  if (code === "unavailable" || code === "deadline-exceeded" || code === "internal") {
    return "unavailable";
  }
  return "unknown";
}

/** Run a Firestore read with a deadline, normalizing failures to CloudReadError. */
export async function cloudRead<T>(read: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      read(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new CloudReadError("timeout")), READ_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    throw err instanceof CloudReadError ? err : new CloudReadError(kindOf(err), err);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Message for a failed read. `what` names the thing that didn't load, e.g.
 * "the user directory" — it lands mid-sentence.
 */
export function cloudErrorMessage(err: unknown, what: string): string {
  const kind = err instanceof CloudReadError ? err.kind : "unknown";
  switch (kind) {
    case "timeout":
    case "unavailable":
      return (
        `Couldn't reach the build database, so ${what} didn't load. ` +
        "Something between this browser and firestore.googleapis.com is blocking it — " +
        "usually an ad or privacy blocker, a strict tracking-protection mode, a VPN, or " +
        "a school/office network. Try again, or reload with blockers paused."
      );
    case "denied":
      return `Not allowed to read ${what}. This is a bug on our side, not yours — please report it.`;
    default:
      return `Something went wrong loading ${what}. Try again in a moment.`;
  }
}
