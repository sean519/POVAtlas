import type { KnockoutMatch, KnockoutResponse, KnockoutRound } from "../src/types";

/**
 * GET /api/knockout — Vercel Edge function.
 *
 * Parses the 2026 World Cup knockout bracket live from the Wikipedia knockout
 * page and returns its matches (round, date, teams-or-placeholders, scores).
 * Teams/scores are `null` until the bracket is decided / matches are played, so
 * the UI auto-fills as the tournament progresses. CDN-cached 5 min.
 */

export const config = { runtime: "edge" };

const API = "https://en.wikipedia.org/w/api.php";
const UA = "POVAtlasResultsBot/1.0 (https://povatlas.com; +knockout)";
const PAGE = "2026 FIFA World Cup knockout stage";
const ALIAS: Record<string, string> = { ALG: "DZA", HAI: "HTI", IRN: "IRI" };
const norm = (c: string) => ALIAS[c] ?? c;

const CACHE_TTL_MS = 5 * 60_000;
let cache: { at: number; data: KnockoutResponse } | null = null;

async function getWikitext(page: string): Promise<string> {
  const url = `${API}?action=parse&prop=wikitext&format=json&formatversion=2&page=${encodeURIComponent(page)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, accept: "application/json" } });
  const text = await res.text();
  if (!res.ok || /too many requests/i.test(text)) throw new Error("fetch failed");
  const json = JSON.parse(text) as { parse?: { wikitext?: string }; error?: unknown };
  if (json.error || !json.parse?.wikitext) throw new Error("no wikitext");
  return json.parse.wikitext;
}

function templateAt(wt: string, i: number): string {
  let depth = 0;
  for (let k = i; k < wt.length; k++) {
    if (wt[k] === "{" && wt[k + 1] === "{") { depth++; k++; }
    else if (wt[k] === "}" && wt[k + 1] === "}") { depth--; k++; if (depth === 0) return wt.slice(i, k + 1); }
  }
  return wt.slice(i);
}

function headingRound(name: string): KnockoutRound | null {
  if (/Round of 32/i.test(name)) return "R32";
  if (/Round of 16/i.test(name)) return "R16";
  if (/Quarter/i.test(name)) return "QF";
  if (/Semi/i.test(name)) return "SF";
  if (/Third place/i.test(name)) return "3P";
  if (/^Final/i.test(name)) return "Final";
  return null;
}

/** Pull "team1"/"team2" → { code|null, label } from a football-box body. */
function teamField(body: string, which: "team1" | "team2"): { code: string | null; label: string } {
  const line = body.match(new RegExp(`\\|\\s*${which}=([^\\n]*)`))?.[1] ?? "";
  // Real team: {{#invoke:flag|fb...|XXX}} NOT inside an HTML comment.
  const live = line.replace(/<!--[\s\S]*?-->/g, "");
  const code = live.match(/\{\{#invoke:[Ff]lag\|[^|]*\|([A-Z]{3})/)?.[1] ?? null;
  // Placeholder label: text after any comment / template.
  const label = line.replace(/<!--[\s\S]*?-->/g, "").replace(/\{\{[^}]*\}\}/g, "").trim();
  return { code: code ? norm(code) : null, label };
}

/** Position-aware round resolver for a page's section headings. */
function roundResolver(wt: string): (idx: number) => KnockoutRound | null {
  const heads = [...wt.matchAll(/^==+\s*([^=\n]+?)\s*==+\s*$/gim)].map((m) => ({ i: m.index ?? 0, name: m[1] }));
  return (idx: number) => {
    let r: KnockoutRound | null = null;
    for (const h of heads) {
      if (h.i < idx) { const hr = headingRound(h.name); if (hr) r = hr; }
      else break;
    }
    return r;
  };
}

/** Parse every football box in `wt` into `out`, keyed/counted per round. */
function collectBoxes(
  wt: string,
  out: KnockoutMatch[],
  perRound: Record<string, number>,
  roundOverride: KnockoutRound | null
): void {
  const roundAt = roundOverride ? null : roundResolver(wt);
  const re = /\{\{#invoke:football box\|main/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(wt))) {
    const body = templateAt(wt, m.index);
    const a = teamField(body, "team1");
    const b = teamField(body, "team2");
    let round = roundOverride ?? roundAt!(m.index);
    // 3rd-place play-off is a "Loser Match …" pairing.
    if (/Loser Match/i.test(a.label) || /Loser Match/i.test(b.label)) round = "3P";
    if (!round) continue;
    const date = (body.match(/\|date=\{\{Start date\|(\d+)\|(\d+)\|(\d+)/) ?? [])
      .slice(1)
      .map((n, k) => (k === 0 ? n : n.padStart(2, "0")))
      .join("-");
    const sc = body.match(/\|score=\{\{score link\|[^|]*\|(\d+)[–-](\d+)(?:\|[^}]*)?\}\}/);
    perRound[round] = (perRound[round] ?? 0) + 1;
    out.push({
      id: `${round}-${perRound[round]}`,
      round,
      date,
      teamA: a.code,
      teamB: b.code,
      labelA: a.label || "TBD",
      labelB: b.label || "TBD",
      scoreA: sc ? parseInt(sc[1], 10) : null,
      scoreB: sc ? parseInt(sc[2], 10) : null,
    });
  }
}

async function buildKnockout(): Promise<KnockoutMatch[]> {
  const wt = await getWikitext(PAGE);
  const out: KnockoutMatch[] = [];
  const perRound: Record<string, number> = {};

  // Inline boxes on the knockout page (currently R16 / QF / SF / 3rd place).
  collectBoxes(wt, out, perRound, null);

  // Big rounds live on their own pages, pulled in via {{#lst:SUBPAGE|…}}
  // (Round of 32, Final). Resolve each subpage's round from the heading it sits
  // under, then fetch + parse it.
  const roundAt = roundResolver(wt);
  const subRounds = new Map<string, KnockoutRound>();
  for (const lm of wt.matchAll(/\{\{#lst:([^|}]+)\|/g)) {
    const sub = lm[1].trim();
    const r = roundAt(lm.index ?? 0);
    if (r && !subRounds.has(sub)) subRounds.set(sub, r);
  }
  await Promise.all(
    [...subRounds].map(async ([sub, round]) => {
      try {
        collectBoxes(await getWikitext(sub), out, perRound, round);
      } catch {
        // subpage unavailable — its round just stays absent this cycle
      }
    })
  );

  return out;
}

export default async function handler(): Promise<Response> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return json(cache.data);
  try {
    const matches = await buildKnockout();
    if (matches.length > 0) {
      const data: KnockoutResponse = {
        updatedAt: new Date(now).toISOString(),
        source: "wikipedia",
        stale: false,
        matches,
      };
      cache = { at: now, data };
      return json(data);
    }
  } catch {
    // fall through
  }
  if (cache) return json({ ...cache.data, source: "wikipedia-cache", stale: true });
  return json({ updatedAt: new Date(now).toISOString(), source: "none", stale: false, matches: [] });
}

function json(data: KnockoutResponse): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
