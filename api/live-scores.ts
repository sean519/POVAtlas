import type { LiveMatchWire, LiveScoresResponse } from "../src/types";
import { fetchApiFootball } from "../src/providers/apiFootball";
import { fetchTheSportsDb } from "../src/providers/theSportsDb";

/**
 * GET /api/live-scores — Vercel Edge function.
 *
 * Tries each configured provider in order (API-Football first, then the free
 * TheSportsDB fallback) and returns the first non-empty result, normalised to
 * `LiveScoresResponse`. The response is cached in the warm isolate for 60s to
 * cap upstream usage (requirement #5). On total failure the last cached payload
 * is served with `stale: true` (requirement #9). The API key is read from the
 * `API_FOOTBALL_KEY` environment variable and never reaches the client.
 *
 * Provider order is the only thing to change to add a new source later
 * (requirement #10) — each provider is just `() => Promise<LiveMatchWire[]>`.
 */

export const config = { runtime: "edge" };

declare const process: { env: Record<string, string | undefined> };

const CACHE_TTL_MS = 60_000;
let cache: { at: number; data: LiveScoresResponse } | null = null;

interface Provider {
  name: string;
  run: () => Promise<LiveMatchWire[]>;
}

function providers(): Provider[] {
  const list: Provider[] = [];
  const key = process.env.API_FOOTBALL_KEY;
  if (key) list.push({ name: "api-football", run: () => fetchApiFootball(key) });
  list.push({ name: "thesportsdb", run: fetchTheSportsDb });
  return list;
}

export default async function handler(): Promise<Response> {
  const now = Date.now();

  if (cache && now - cache.at < CACHE_TTL_MS) {
    return json(cache.data, 60);
  }

  for (const p of providers()) {
    let matches: LiveMatchWire[] = [];
    try {
      matches = await p.run();
    } catch {
      matches = [];
    }
    if (matches.length > 0) {
      const data: LiveScoresResponse = {
        updatedAt: new Date(now).toISOString(),
        source: p.name,
        stale: false,
        matches,
      };
      cache = { at: now, data };
      return json(data, 60);
    }
  }

  // Every provider returned nothing. Serve the last good payload if we have one
  // (so the client can still show scores + "Last updated"), else an empty set.
  if (cache) {
    return json({ ...cache.data, source: "cache", stale: true }, 30);
  }
  return json(
    { updatedAt: new Date(now).toISOString(), source: "none", stale: false, matches: [] },
    30
  );
}

function json(data: LiveScoresResponse, sMaxAge: number): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120`,
    },
  });
}
