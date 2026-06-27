import type { LiveMatchWire, LiveScoresResponse } from "../src/types";

/**
 * GET /api/results — Vercel Edge function.
 *
 * Returns the COMPLETE set of played 2026 World Cup group-stage results, parsed
 * live from the Wikipedia per-group pages (the official, complete source). This
 * is the runtime backbone for finished-match scores: unlike the live-score
 * providers (TheSportsDB / API-Football) it covers *every* finished match, so
 * the site no longer depends on the 30-min GitHub refresh being timely.
 *
 * The response is CDN-cached for 5 minutes (`s-maxage`) with a 10-minute
 * stale-while-revalidate window, so the ~12 upstream fetches happen at most once
 * every 5 minutes globally and users never block on a refresh. A warm-isolate
 * cache is a secondary guard. Only played matches (with a score) are returned;
 * the client overlays them onto the bundled fixtures, so a transient parse miss
 * never blanks a score.
 */

export const config = { runtime: "edge" };

const API = "https://en.wikipedia.org/w/api.php";
const UA = "POVAtlasResultsBot/1.0 (https://povatlas.com; +runtime results)";
const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const ALIAS: Record<string, string> = { ALG: "DZA", HAI: "HTI", IRN: "IRI" };
const norm = (c: string) => ALIAS[c] ?? c;

const CACHE_TTL_MS = 5 * 60_000;
let cache: { at: number; data: LiveScoresResponse } | null = null;

async function getWikitext(page: string): Promise<string> {
  const url = `${API}?action=parse&prop=wikitext&format=json&formatversion=2&page=${encodeURIComponent(page)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, accept: "application/json" } });
  const text = await res.text();
  if (!res.ok || /too many requests/i.test(text)) throw new Error(`fetch failed for ${page}`);
  const json = JSON.parse(text) as { parse?: { wikitext?: string }; error?: unknown };
  if (json.error || !json.parse?.wikitext) throw new Error(`no wikitext for ${page}`);
  return json.parse.wikitext;
}

/** Brace-balanced capture of the {{...}} starting at index i. */
function templateAt(wt: string, i: number): string {
  let depth = 0;
  for (let k = i; k < wt.length; k++) {
    if (wt[k] === "{" && wt[k + 1] === "{") { depth++; k++; }
    else if (wt[k] === "}" && wt[k + 1] === "}") { depth--; k++; if (depth === 0) return wt.slice(i, k + 1); }
  }
  return wt.slice(i);
}

interface Box { a: string; b: string; sa: number | null; sb: number | null; }

function parseBox(body: string): Box | null {
  const t1 = body.match(/team1=\{\{#invoke:flag\|[^|]*\|([A-Z]{3})/);
  const t2 = body.match(/team2=\{\{#invoke:flag\|[^|]*\|([A-Z]{3})/);
  if (!t1 || !t2) return null;
  // score link has 2 or 3 params: {{score link|anchor|X–Y}} or {{...|X–Y|article}}
  const sc = body.match(/score=\{\{score link\|[^|]*\|(\d+)[–-](\d+)(?:\|[^}]*)?\}\}/);
  return {
    a: norm(t1[1]), b: norm(t2[1]),
    sa: sc ? parseInt(sc[1], 10) : null,
    sb: sc ? parseInt(sc[2], 10) : null,
  };
}

function parseGroup(wt: string): { boxes: Box[]; splitTitles: string[] } {
  const boxes: Box[] = [];
  const re = /\{\{#invoke:football box\|main/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(wt))) {
    const r = parseBox(templateAt(wt, m.index));
    if (r) boxes.push(r);
  }
  const splitTitles = [...wt.matchAll(/\{\{main\|([^|}]+ v [^|}]+ \(2026 FIFA World Cup\))\}\}/g)].map((x) => x[1].trim());
  return { boxes, splitTitles };
}

async function buildResults(): Promise<LiveMatchWire[]> {
  const byPair = new Map<string, Box>();
  const splitTitles = new Set<string>();

  // 12 group pages in parallel; a failed page is skipped (partial is fine).
  const pages = await Promise.all(
    GROUPS.map((g) => getWikitext(`2026 FIFA World Cup Group ${g}`).then((wt) => parseGroup(wt)).catch(() => null))
  );
  for (const p of pages) {
    if (!p) continue;
    for (const b of p.boxes) byPair.set([b.a, b.b].sort().join("|"), b);
    p.splitTitles.forEach((t) => splitTitles.add(t));
  }

  // Split-out match articles (e.g. notable matches with their own page).
  const splits = await Promise.all(
    [...splitTitles].map((t) =>
      getWikitext(t).then((wt) => {
        const idx = wt.search(/\{\{#invoke:football box\|main/i);
        return idx === -1 ? null : parseBox(templateAt(wt, idx));
      }).catch(() => null)
    )
  );
  for (const b of splits) if (b) byPair.set([b.a, b.b].sort().join("|"), b);

  // Only played matches, as finished LiveMatchWire entries.
  const out: LiveMatchWire[] = [];
  for (const b of byPair.values()) {
    if (b.sa === null || b.sb === null) continue;
    out.push({ teamA: b.a, teamB: b.b, scoreA: b.sa, scoreB: b.sb, status: "finished" });
  }
  return out;
}

export default async function handler(): Promise<Response> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return json(cache.data);

  try {
    const matches = await buildResults();
    if (matches.length > 0) {
      const data: LiveScoresResponse = {
        updatedAt: new Date(now).toISOString(),
        source: "wikipedia",
        stale: false,
        matches,
      };
      cache = { at: now, data };
      return json(data);
    }
  } catch {
    // fall through to stale cache / empty
  }
  if (cache) return json({ ...cache.data, source: "wikipedia-cache", stale: true });
  return json({ updatedAt: new Date(now).toISOString(), source: "none", stale: false, matches: [] });
}

function json(data: LiveScoresResponse): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
