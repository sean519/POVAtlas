import { teams } from "../data/teams";
import type { LiveResult } from "../data/matches";
import type { MatchStatus } from "../types";

/**
 * Live World Cup scores via TheSportsDB's free JSON API (test key "3", which
 * sends `Access-Control-Allow-Origin: *`, so a pure front-end app can call it
 * directly). This is an unofficial community source: coverage/latency vary and
 * the shared key is rate-limited, so failures are swallowed and the app simply
 * keeps the bundled fixture data until the next successful poll.
 */

const API = "https://www.thesportsdb.com/api/v1/json/3";

/** Normalise a country name for fuzzy matching (lowercase, strip accents/punct). */
function norm(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// fifaCode lookup: our own team names first, then known TheSportsDB variants.
const NAME_TO_CODE: Record<string, string> = {};
for (const t of teams) {
  NAME_TO_CODE[norm(t.teamName)] = t.fifaCode;
  NAME_TO_CODE[norm(t.countryName)] = t.fifaCode;
}
// TheSportsDB spellings that differ from ours.
const ALIASES: Record<string, string> = {
  usa: "USA",
  unitedstatesofamerica: "USA",
  czechrepublic: "CZE",
  bosniaherzegovina: "BIH",
  drcongo: "COD",
  congodr: "COD",
  democraticrepublicofcongo: "COD",
  turkiye: "TUR",
  korearepublic: "KOR",
  iranislamicrepublic: "IRI",
  capeverdeislands: "CPV",
  ivorycoast: "CIV",
  cotedivoire: "CIV",
};
for (const [k, v] of Object.entries(ALIASES)) NAME_TO_CODE[k] = v;

function codeForName(name: string | null | undefined): string | undefined {
  if (!name) return undefined;
  return NAME_TO_CODE[norm(name)];
}

interface TsdbEvent {
  strLeague?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string | null;
  strProgress?: string | null;
}

const FINISHED = /^(ft|aet|ap|pen|match finished|finished|aot)$/i;
const LIVE = /^(1h|2h|ht|et|bt|p|live|match live|playing|in play|1st half|2nd half|half time|break time|penalties)$/i;

/** Map a TheSportsDB status/progress to our MatchStatus, or null if unknown. */
function mapStatus(status?: string | null, progress?: string | null): MatchStatus | null {
  const s = (status ?? "").trim();
  if (FINISHED.test(s)) return "finished";
  if (LIVE.test(s)) return "live";
  // Some events only expose a live minute via strProgress (e.g. "57").
  if (progress && /^\d+'?$/.test(progress.trim())) return "live";
  return null;
}

async function fetchDay(dateUtc: string): Promise<TsdbEvent[]> {
  try {
    const res = await fetch(`${API}/eventsday.php?d=${dateUtc}&s=Soccer`);
    if (!res.ok) return [];
    const data = (await res.json()) as { events?: TsdbEvent[] | null };
    return (data.events ?? []).filter((e) => /world cup/i.test(e.strLeague ?? ""));
  } catch {
    return [];
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function utcDateString(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/**
 * Fetch current/recent World Cup results. We query yesterday/today/tomorrow in
 * UTC so the whole current Pacific match day is covered whatever the hour: PDT
 * kickoffs 12:00–21:00 land on UTC date D (19:00+) and D+1 (00:00–04:00), and
 * "now" in PDT can read as either UTC date. Returns only confidently classified
 * (finished/live) fixtures with numeric scores.
 */
export async function fetchLiveScores(): Promise<LiveResult[]> {
  // Sequential with a small gap: the shared free key rate-limits bursts, so
  // parallel requests silently drop some days. Spacing them keeps it reliable.
  const events: TsdbEvent[] = [];
  const offsets = [-1, 0, 1];
  for (let i = 0; i < offsets.length; i++) {
    if (i > 0) await sleep(400);
    events.push(...(await fetchDay(utcDateString(offsets[i]))));
  }

  const out: LiveResult[] = [];
  const seen = new Set<string>();
  for (const e of events) {
    const teamA = codeForName(e.strHomeTeam);
    const teamB = codeForName(e.strAwayTeam);
    if (!teamA || !teamB) continue;
    const status = mapStatus(e.strStatus, e.strProgress);
    if (!status) continue;
    const scoreA = Number(e.intHomeScore);
    const scoreB = Number(e.intAwayScore);
    if (!Number.isFinite(scoreA) || !Number.isFinite(scoreB)) continue;
    const key = [teamA, teamB].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ teamA, teamB, scoreA, scoreB, status });
  }
  return out;
}
