import type { LiveEvent, LiveInfo, LiveMatchWire, MatchStatus } from "../types";
import { codeForName } from "../utils/teamNameMatch";
import { utcDate } from "./providerUtils";

/**
 * API-Football (v3, api-sports.io) provider — the primary source. The API key
 * is NEVER imported here from the environment; the serverless route reads
 * `API_FOOTBALL_KEY` and passes it in, so this module stays free of secrets and
 * is safe to unit-test. World Cup is league id 1.
 */

const BASE = "https://v3.football.api-sports.io";
const WORLD_CUP_LEAGUE = 1;
const SEASON = 2026;

// ---- Minimal shapes of the API-Football JSON we consume ----
interface AfTeam {
  name?: string;
}
interface AfFixture {
  fixture?: { id?: number; status?: { short?: string; elapsed?: number | null } };
  league?: { id?: number };
  teams?: { home?: AfTeam; away?: AfTeam };
  goals?: { home?: number | null; away?: number | null };
  score?: { halftime?: { home?: number | null; away?: number | null } };
}
interface AfFixturesResponse {
  response?: AfFixture[];
}
interface AfEvent {
  time?: { elapsed?: number | null };
  team?: { name?: string };
  player?: { name?: string };
  type?: string;
  detail?: string;
}
interface AfEventsResponse {
  response?: AfEvent[];
}

const LIVE_SHORT = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"]);
const FINISHED_SHORT = new Set(["FT", "AET", "PEN"]);

function classify(short: string | undefined): MatchStatus | null {
  if (!short) return null;
  if (FINISHED_SHORT.has(short)) return "finished";
  if (LIVE_SHORT.has(short)) return "live";
  return null; // NS / TBD / postponed → leave to the bundled schedule
}

/** Pure: build wire results from fixtures + a fixtureId→events lookup. */
export function mapApiFootballFixtures(
  fixtures: AfFixture[],
  eventsByFixture: Map<number, AfEvent[]>
): LiveMatchWire[] {
  const out: LiveMatchWire[] = [];
  const seen = new Set<string>();
  for (const f of fixtures) {
    if (f.league?.id !== WORLD_CUP_LEAGUE) continue;
    const teamA = codeForName(f.teams?.home?.name);
    const teamB = codeForName(f.teams?.away?.name);
    if (!teamA || !teamB) continue;
    const status = classify(f.fixture?.status?.short);
    if (!status) continue;
    const scoreA = f.goals?.home ?? null;
    const scoreB = f.goals?.away ?? null;
    if (scoreA === null || scoreB === null) continue;
    const key = [teamA, teamB].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    const events: LiveEvent[] = [];
    let redCardsA = 0;
    let redCardsB = 0;
    const raw = f.fixture?.id != null ? eventsByFixture.get(f.fixture.id) ?? [] : [];
    for (const ev of raw) {
      const code = codeForName(ev.team?.name);
      if (!code) continue;
      const minute = ev.time?.elapsed ?? null;
      if (ev.type === "Goal" && !/missed/i.test(ev.detail ?? "")) {
        events.push({ team: code, type: "goal", minute, player: ev.player?.name });
      } else if (ev.type === "Card" && /red/i.test(ev.detail ?? "")) {
        events.push({ team: code, type: "red-card", minute, player: ev.player?.name });
        if (code === teamA) redCardsA++;
        else if (code === teamB) redCardsB++;
      }
    }

    const live: LiveInfo = {
      stage: f.fixture?.status?.short ?? (status === "finished" ? "FT" : "LIVE"),
      minute: status === "live" ? f.fixture?.status?.elapsed ?? null : null,
      halftimeA: f.score?.halftime?.home ?? null,
      halftimeB: f.score?.halftime?.away ?? null,
      redCardsA,
      redCardsB,
      events,
    };
    out.push({ teamA, teamB, scoreA, scoreB, status, live });
  }
  return out;
}

async function afGet<T>(path: string, key: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": key } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Fetch World Cup fixtures for yesterday+today (UTC), then events for the ones
 * in play, and map everything to our wire shape. Network errors yield [] so the
 * route can fall back to the next provider.
 */
export async function fetchApiFootball(key: string): Promise<LiveMatchWire[]> {
  const dates = [utcDate(0), utcDate(-1)];
  const fixtures: AfFixture[] = [];
  for (const d of dates) {
    const json = await afGet<AfFixturesResponse>(
      `/fixtures?league=${WORLD_CUP_LEAGUE}&season=${SEASON}&date=${d}`,
      key
    );
    if (json?.response) fixtures.push(...json.response);
  }

  // Only pull events for in-play fixtures, to keep API usage low.
  const eventsByFixture = new Map<number, AfEvent[]>();
  const liveFixtures = fixtures.filter(
    (f) => LIVE_SHORT.has(f.fixture?.status?.short ?? "") && f.fixture?.id != null
  );
  for (const f of liveFixtures) {
    const id = f.fixture!.id!;
    const json = await afGet<AfEventsResponse>(`/fixtures/events?fixture=${id}`, key);
    if (json?.response) eventsByFixture.set(id, json.response);
  }

  return mapApiFootballFixtures(fixtures, eventsByFixture);
}
