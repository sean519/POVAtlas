import type { LiveMatchWire, LiveScoresResponse } from "../types";
import { fetchTheSportsDb } from "../providers/theSportsDb";

/**
 * Front-end score loader. Combines two sources so the UI always has complete,
 * current results:
 *
 *  1. `/api/results` — the COMPLETE set of finished group-stage results, parsed
 *     live from Wikipedia (covers every finished match, refreshed within minutes).
 *  2. `/api/live-scores` — the live provider chain (API-Football / TheSportsDB)
 *     for IN-PROGRESS matches (minute-by-minute), with a direct-TheSportsDB
 *     fallback if the backend route isn't deployed.
 *
 * Wikipedia is the base (authoritative for finished matches); the live feed is
 * overlaid for matches that are actually in progress. Either source can fail
 * independently without breaking the other.
 */
export async function fetchLiveScores(): Promise<LiveScoresResponse> {
  const [live, wiki] = await Promise.all([fetchLiveFeed(), fetchWikiResults()]);

  if (wiki.length === 0) return live; // no complete-results source available
  const matches = mergeWires(wiki, live.matches);
  return {
    updatedAt: new Date().toISOString(),
    source: `wikipedia+${live.source}`,
    stale: live.stale,
    matches,
  };
}

/** Complete finished results from the Wikipedia-backed route (empty if absent). */
async function fetchWikiResults(): Promise<LiveMatchWire[]> {
  try {
    const res = await fetch("/api/results", { headers: { accept: "application/json" } });
    if (res.ok && (res.headers.get("content-type") ?? "").includes("application/json")) {
      const data = (await res.json()) as LiveScoresResponse;
      if (Array.isArray(data.matches)) return data.matches;
    }
  } catch {
    // Route not deployed / unreachable — fall back to live feed only.
  }
  return [];
}

/** Live provider chain via the backend route, or direct TheSportsDB fallback. */
async function fetchLiveFeed(): Promise<LiveScoresResponse> {
  try {
    const res = await fetch("/api/live-scores", { headers: { accept: "application/json" } });
    if (res.ok && (res.headers.get("content-type") ?? "").includes("application/json")) {
      const data = (await res.json()) as LiveScoresResponse;
      if (Array.isArray(data.matches)) return data;
    }
  } catch {
    // Backend unreachable — fall through to the direct client fallback.
  }

  const matches = await fetchTheSportsDb();
  return {
    updatedAt: new Date().toISOString(),
    source: "thesportsdb-direct",
    stale: false,
    matches,
  };
}

const pairKey = (w: LiveMatchWire) => [w.teamA, w.teamB].sort().join("|");

/**
 * Merge two wire lists. `base` (Wikipedia: complete finished results) is the
 * authority; an `overlay` entry (live feed) only wins when it is actively in
 * progress or the base doesn't have that match at all.
 */
function mergeWires(base: LiveMatchWire[], overlay: LiveMatchWire[]): LiveMatchWire[] {
  const map = new Map<string, LiveMatchWire>();
  for (const w of base) map.set(pairKey(w), w);
  for (const w of overlay) {
    const k = pairKey(w);
    if (!map.has(k) || w.status === "live" || w.live) map.set(k, w);
  }
  return [...map.values()];
}
