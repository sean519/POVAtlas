import type { LiveMatchWire, MatchStatus } from "../types";
import { codeForName } from "../utils/teamNameMatch";

/**
 * TheSportsDB provider — free JSON API (test key "3", CORS-enabled). Used as a
 * no-cost fallback behind API-Football. Coverage is partial and the shared key
 * is rate-limited, so requests are sequenced and failures yield an empty list.
 * It exposes score/status/minute but not goal-scorer / red-card events.
 */

const API = "https://www.thesportsdb.com/api/v1/json/3";

export interface TsdbEvent {
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

function classify(status?: string | null, progress?: string | null): MatchStatus | null {
  const s = (status ?? "").trim();
  if (FINISHED.test(s)) return "finished";
  if (LIVE.test(s)) return "live";
  if (progress && /^\d+'?$/.test(progress.trim())) return "live";
  return null;
}

/** Pure: map raw TheSportsDB day-events to our wire shape. */
export function mapTheSportsDbEvents(events: TsdbEvent[]): LiveMatchWire[] {
  const out: LiveMatchWire[] = [];
  const seen = new Set<string>();
  for (const e of events) {
    if (!/world cup/i.test(e.strLeague ?? "")) continue;
    const teamA = codeForName(e.strHomeTeam);
    const teamB = codeForName(e.strAwayTeam);
    if (!teamA || !teamB) continue;
    const status = classify(e.strStatus, e.strProgress);
    if (!status) continue;
    const scoreA = Number(e.intHomeScore);
    const scoreB = Number(e.intAwayScore);
    if (!Number.isFinite(scoreA) || !Number.isFinite(scoreB)) continue;
    const key = [teamA, teamB].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    const minuteRaw = (e.strProgress ?? "").replace(/'/g, "").trim();
    const minute = status === "live" && /^\d+$/.test(minuteRaw) ? Number(minuteRaw) : null;
    out.push({
      teamA,
      teamB,
      scoreA,
      scoreB,
      status,
      live: {
        stage: (e.strStatus ?? "").trim().toUpperCase() || (status === "live" ? "LIVE" : "FT"),
        minute,
        halftimeA: null,
        halftimeB: null,
        redCardsA: 0,
        redCardsB: 0,
        events: [],
      },
    });
  }
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function utcDate(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

async function fetchDay(dateUtc: string): Promise<TsdbEvent[]> {
  try {
    const res = await fetch(`${API}/eventsday.php?d=${dateUtc}&s=Soccer`);
    if (!res.ok) return [];
    const data = (await res.json()) as { events?: TsdbEvent[] | null };
    return data.events ?? [];
  } catch {
    return [];
  }
}

/** Fetch yesterday/today/tomorrow (UTC) and map to wire results. */
export async function fetchTheSportsDb(): Promise<LiveMatchWire[]> {
  const all: TsdbEvent[] = [];
  const offsets = [-1, 0, 1];
  for (let i = 0; i < offsets.length; i++) {
    if (i > 0) await sleep(400);
    all.push(...(await fetchDay(utcDate(offsets[i]))));
  }
  return mapTheSportsDbEvents(all);
}
