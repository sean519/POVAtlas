import type { KnockoutMatch, KnockoutResponse } from "../types";

/**
 * Load the knockout bracket from `/api/knockout` (Wikipedia-backed). Returns an
 * empty list if the route isn't available (e.g. static dev) or the fetch fails,
 * so the rest of the UI is unaffected.
 */
export async function fetchKnockout(): Promise<KnockoutMatch[]> {
  try {
    const res = await fetch("/api/knockout", { headers: { accept: "application/json" } });
    if (res.ok && (res.headers.get("content-type") ?? "").includes("application/json")) {
      const data = (await res.json()) as KnockoutResponse;
      if (Array.isArray(data.matches)) return data.matches;
    }
  } catch {
    // route unavailable — knockout section just stays hidden
  }
  return [];
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
