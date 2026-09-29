import type { KnockoutMatch, KnockoutResponse } from "../types";
import { KNOCKOUT_RESULTS } from "../data/knockoutResults";
import { isTournamentOver } from "../data/matches";

/**
 * Load the knockout bracket. Once the tournament is over the bundled final
 * bracket is authoritative (no network, immune to later Wikipedia edits).
 * Before that, `/api/knockout` (Wikipedia-backed) is used, falling back to the
 * bundled data if the route is unavailable (e.g. static dev) or fails.
 */
export async function fetchKnockout(): Promise<KnockoutMatch[]> {
  if (isTournamentOver()) return KNOCKOUT_RESULTS;
  try {
    const res = await fetch("/api/knockout", { headers: { accept: "application/json" } });
    if (res.ok && (res.headers.get("content-type") ?? "").includes("application/json")) {
      const data = (await res.json()) as KnockoutResponse;
      if (Array.isArray(data.matches) && data.matches.length > 0) return data.matches;
    }
  } catch {
    // route unavailable — fall through to the bundled bracket
  }
  return KNOCKOUT_RESULTS;
}

/** The side that advanced from a played knockout tie, or null if not decided. */
export function knockoutWinner(k: KnockoutMatch): string | null {
  if (!k.teamA || !k.teamB || k.scoreA === null || k.scoreB === null) return null;
  if (k.scoreA !== k.scoreB) return k.scoreA > k.scoreB ? k.teamA : k.teamB;
  if (k.penA == null || k.penB == null || k.penA === k.penB) return null;
  return k.penA > k.penB ? k.teamA : k.teamB;
}

/** Human label + emoji for each round, in bracket order. */
export const ROUND_META: Record<KnockoutMatch["round"], { label: string; order: number }> = {
  R32: { label: "Round of 32", order: 0 },
  R16: { label: "Round of 16", order: 1 },
  QF: { label: "Quarter-finals", order: 2 },
  SF: { label: "Semi-finals", order: 3 },
  "3P": { label: "Third place", order: 4 },
  Final: { label: "Final", order: 5 },
};
