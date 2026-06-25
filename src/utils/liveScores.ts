import type { LiveScoresResponse } from "../types";
import { fetchTheSportsDb } from "../providers/theSportsDb";

/**
 * Front-end live-score loader. Prefers the backend route `/api/live-scores`
 * (which hides the API-Football key and runs the provider chain server-side).
 * If that route isn't available yet — e.g. while the site is still served as a
 * static build before the Vercel backend is deployed — it falls back to calling
 * the free TheSportsDB API directly from the browser so scores still work.
 */
export async function fetchLiveScores(): Promise<LiveScoresResponse> {
  try {
    const res = await fetch("/api/live-scores", {
      headers: { accept: "application/json" },
    });
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
