import type { Group, LiveInfo, LiveMatchWire, Match, MatchStatus } from "../types";
import {
  kickoffToMinutes,
  MATCH_DURATION_MINUTES,
  nowMinutesInKickoffTz,
  todayInKickoffTz,
} from "../utils/formatters";

/**
 * 2026 FIFA World Cup group-stage schedule (USA · Canada · Mexico).
 *
 * 12 groups × 3 matchdays = 72 matches, June 11–27 2026. Dates, kickoff
 * pairings, venues and scorelines follow the published tournament schedule
 * and results. Matchday 3 of the early groups (A/B/C) falls on June 24.
 *
 * Match status uses the kickoff timezone (PDT): finished after full time,
 * live between kickoff and ~115 min later, scheduled before kickoff or on
 * future dates. Scores from the fixture table are kept for finished and
 * live matches when present.
 *
 * All kickoff times are expressed in US Pacific (PDT, UTC-7); the UI labels
 * them via `KICKOFF_TZ` / `formatKickoff` in utils/formatters.
 */

const TODAY = todayInKickoffTz();

function statusFor(date: string, kickoffTime: string): MatchStatus {
  if (date < TODAY) return "finished";
  if (date > TODAY) return "scheduled";

  const kickoff = kickoffToMinutes(kickoffTime);
  const now = nowMinutesInKickoffTz();
  if (now < kickoff) return "scheduled";
  if (now < kickoff + MATCH_DURATION_MINUTES) return "live";
  return "finished";
}

function fixtureHasScore(
  scoreA: number | null,
  scoreB: number | null
): scoreA is number {
  return scoreA !== null && scoreB !== null;
}

// ---- Host venues (stadium + city) keyed by short code ----
interface Venue {
  venue: string;
  city: string;
}

const VENUES: Record<string, Venue> = {
  AZT: { venue: "Estadio Azteca", city: "Mexico City" },
  AKR: { venue: "Estadio Akron", city: "Guadalajara" },
  BBVA: { venue: "Estadio BBVA", city: "Monterrey" },
  BMO: { venue: "BMO Field", city: "Toronto" },
  BC: { venue: "BC Place", city: "Vancouver" },
  METLIFE: { venue: "MetLife Stadium", city: "New York / New Jersey" },
  GILLETTE: { venue: "Gillette Stadium", city: "Boston" },
  LINC: { venue: "Lincoln Financial Field", city: "Philadelphia" },
  HARDROCK: { venue: "Hard Rock Stadium", city: "Miami" },
  MBENZ: { venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  NRG: { venue: "NRG Stadium", city: "Houston" },
  ATT: { venue: "AT&T Stadium", city: "Dallas" },
  ARROW: { venue: "Arrowhead Stadium", city: "Kansas City" },
  LEVIS: { venue: "Levi's Stadium", city: "San Francisco Bay Area" },
  SOFI: { venue: "SoFi Stadium", city: "Los Angeles" },
  LUMEN: { venue: "Lumen Field", city: "Seattle" },
};

/**
 * Fixture rows. A score of `null` means the match has not been played yet
 * (its status is derived from the date relative to "today").
 *
 * Tuple: [group, matchday, date, kickoff, teamA, teamB, venueKey, scoreA, scoreB]
 */
type Fixture = [
  Group,
  1 | 2 | 3,
  string,
  string,
  string,
  string,
  keyof typeof VENUES,
  number | null,
  number | null
];

// All kickoff times are US Pacific (PDT, UTC-7). Converted from the official
// Eastern schedule: subtract 3 h. Three late-night ET fixtures cross midnight
// and land on the previous PT calendar date (noted inline).
const FIXTURES: Fixture[] = [
  // ---- Group A (MEX, RSA, KOR, CZE) ----
  ["A", 1, "2026-06-11", "09:00", "MEX", "RSA", "AZT",      2, 0],
  ["A", 1, "2026-06-11", "12:00", "KOR", "CZE", "AKR",      2, 1],
  ["A", 2, "2026-06-18", "09:00", "CZE", "RSA", "MBENZ",    1, 1],
  ["A", 2, "2026-06-18", "18:00", "MEX", "KOR", "AKR",      1, 0],
  ["A", 3, "2026-06-24", "18:00", "MEX", "CZE", "AZT",      3, 0],
  ["A", 3, "2026-06-24", "18:00", "RSA", "KOR", "AKR",      1, 0],

  // ---- Group B (CAN, BIH, QAT, SUI) ----
  ["B", 1, "2026-06-12", "09:00", "CAN", "BIH", "BMO",      1, 1],
  ["B", 1, "2026-06-13", "09:00", "QAT", "SUI", "LEVIS",    1, 1],
  ["B", 2, "2026-06-18", "12:00", "SUI", "BIH", "SOFI",     4, 1],
  ["B", 2, "2026-06-18", "15:00", "CAN", "QAT", "BC",       6, 0],
  ["B", 3, "2026-06-24", "12:00", "CAN", "SUI", "BMO",      1, 2],
  ["B", 3, "2026-06-24", "12:00", "BIH", "QAT", "BC",       3, 1],

  // ---- Group C (BRA, MAR, HTI, SCO) ----
  ["C", 1, "2026-06-13", "12:00", "BRA", "MAR", "METLIFE",  1, 1],
  ["C", 1, "2026-06-13", "15:00", "HTI", "SCO", "GILLETTE", 0, 1],
  ["C", 2, "2026-06-19", "12:00", "SCO", "MAR", "GILLETTE", 0, 1],
  ["C", 2, "2026-06-19", "15:00", "BRA", "HTI", "LINC",     3, 0],
  ["C", 3, "2026-06-24", "15:00", "SCO", "BRA", "HARDROCK", 0, 3],
  ["C", 3, "2026-06-24", "15:00", "MAR", "HTI", "MBENZ",    4, 2],

  // ---- Group D (USA, PAR, AUS, TUR) ----
  ["D", 1, "2026-06-12", "12:00", "USA", "PAR", "SOFI",     4, 1],
  ["D", 1, "2026-06-14", "09:00", "AUS", "TUR", "BC",       2, 0],
  ["D", 2, "2026-06-19", "09:00", "USA", "AUS", "LUMEN",    2, 0],
  ["D", 2, "2026-06-19", "18:00", "TUR", "PAR", "LEVIS",    0, 1],
  ["D", 3, "2026-06-25", "19:00", "USA", "TUR", "SOFI",     2, 3],
  ["D", 3, "2026-06-25", "19:00", "PAR", "AUS", "LEVIS",    0, 0],

  // ---- Group E (GER, CUW, CIV, ECU) ----
  ["E", 1, "2026-06-14", "12:00", "GER", "CUW", "NRG",      7, 1],
  ["E", 1, "2026-06-14", "18:00", "CIV", "ECU", "LINC",     1, 0],
  ["E", 2, "2026-06-20", "12:00", "GER", "CIV", "BMO",      2, 1],
  ["E", 2, "2026-06-20", "15:00", "ECU", "CUW", "ARROW",    0, 0],
  ["E", 3, "2026-06-25", "13:00", "ECU", "GER", "METLIFE",  2, 1],
  ["E", 3, "2026-06-25", "13:00", "CUW", "CIV", "LINC",     0, 2],

  // ---- Group F (NED, JPN, SWE, TUN) ----
  // SWE-TUN: midnight ET Jun 14 → 21:00 PDT Jun 13
  ["F", 1, "2026-06-13", "21:00", "SWE", "TUN", "BBVA",     5, 1],
  ["F", 1, "2026-06-14", "15:00", "NED", "JPN", "ATT",      2, 2],
  ["F", 2, "2026-06-20", "09:00", "NED", "SWE", "NRG",      5, 1],
  ["F", 2, "2026-06-21", "09:00", "TUN", "JPN", "BBVA",     0, 4],
  ["F", 3, "2026-06-25", "16:00", "JPN", "SWE", "ATT",      1, 1],
  ["F", 3, "2026-06-25", "16:00", "TUN", "NED", "ARROW",    1, 3],

  // ---- Group G (BEL, EGY, IRI, NZL) ----
  // NZL-EGY: midnight ET Jun 21 → 21:00 PDT Jun 20
  ["G", 1, "2026-06-15", "12:00", "BEL", "EGY", "LUMEN",    1, 1],
  ["G", 1, "2026-06-15", "18:00", "IRI", "NZL", "SOFI",     2, 2],
  ["G", 2, "2026-06-20", "21:00", "NZL", "EGY", "BC",       1, 3],
  ["G", 2, "2026-06-21", "15:00", "BEL", "IRI", "SOFI",     0, 0],
  ["G", 3, "2026-06-26", "12:00", "EGY", "IRI", "LUMEN",    1, 1],
  ["G", 3, "2026-06-26", "20:00", "NZL", "BEL", "BC",       1, 5],

  // ---- Group H (ESP, CPV, KSA, URU) ----
  ["H", 1, "2026-06-15", "09:00", "ESP", "CPV", "MBENZ",    0, 0],
  ["H", 1, "2026-06-15", "15:00", "KSA", "URU", "HARDROCK", 1, 1],
  ["H", 2, "2026-06-21", "12:00", "ESP", "KSA", "MBENZ",    4, 0],
  ["H", 2, "2026-06-21", "18:00", "URU", "CPV", "HARDROCK", 2, 2],
  ["H", 3, "2026-06-26", "17:00", "CPV", "KSA", "NRG",      0, 0],
  ["H", 3, "2026-06-26", "17:00", "URU", "ESP", "AKR",      0, 1],

  // ---- Group I (FRA, SEN, IRQ, NOR) ----
  ["I", 1, "2026-06-16", "09:00", "FRA", "SEN", "METLIFE",  3, 1],
  ["I", 1, "2026-06-16", "12:00", "IRQ", "NOR", "GILLETTE", 1, 4],
  ["I", 2, "2026-06-22", "12:00", "FRA", "IRQ", "LINC",     3, 0],
  ["I", 2, "2026-06-22", "15:00", "NOR", "SEN", "METLIFE",  3, 2],
  ["I", 3, "2026-06-26", "12:00", "NOR", "FRA", "GILLETTE", 1, 4],
  ["I", 3, "2026-06-26", "12:00", "SEN", "IRQ", "BMO",      5, 0],

  // ---- Group J (ARG, DZA, AUT, JOR) ----
  ["J", 1, "2026-06-16", "18:00", "ARG", "DZA", "ARROW",    3, 0],
  ["J", 1, "2026-06-17", "09:00", "AUT", "JOR", "LEVIS",    3, 1],
  ["J", 2, "2026-06-22", "09:00", "ARG", "AUT", "ATT",      2, 0],
  ["J", 2, "2026-06-22", "18:00", "JOR", "DZA", "LEVIS",    1, 2],
  ["J", 3, "2026-06-27", "19:00", "DZA", "AUT", "ARROW",    null, null],
  ["J", 3, "2026-06-27", "19:00", "JOR", "ARG", "ATT",      null, null],

  // ---- Group K (POR, COD, UZB, COL) ----
  // COL-UZB: midnight ET Jun 17 → 21:00 PDT Jun 16
  ["K", 1, "2026-06-16", "21:00", "UZB", "COL", "AZT",      1, 3],
  ["K", 1, "2026-06-17", "12:00", "POR", "COD", "NRG",      1, 1],
  ["K", 2, "2026-06-23", "09:00", "POR", "UZB", "NRG",      5, 0],
  ["K", 2, "2026-06-23", "18:00", "COL", "COD", "AKR",      1, 0],
  ["K", 3, "2026-06-27", "16:30", "COL", "POR", "HARDROCK", 0, 0],
  ["K", 3, "2026-06-27", "16:30", "COD", "UZB", "MBENZ",    3, 1],

  // ---- Group L (ENG, CRO, GHA, PAN) ----
  ["L", 1, "2026-06-17", "15:00", "ENG", "CRO", "ATT",      4, 2],
  ["L", 1, "2026-06-17", "18:00", "GHA", "PAN", "BMO",      1, 0],
  ["L", 2, "2026-06-23", "12:00", "ENG", "GHA", "GILLETTE", 0, 0],
  ["L", 2, "2026-06-23", "15:00", "PAN", "CRO", "BMO",      0, 1],
  ["L", 3, "2026-06-27", "14:00", "PAN", "ENG", "METLIFE",  0, 2],
  ["L", 3, "2026-06-27", "14:00", "CRO", "GHA", "LINC",     2, 1],
];

function buildMatches(): Match[] {
  const result: Match[] = FIXTURES.map(
    ([group, md, date, time, teamA, teamB, venueKey, scoreA, scoreB]) => {
      const status = statusFor(date, time);
      const place = VENUES[venueKey];
      const showScore =
        (status === "finished" || status === "live") &&
        fixtureHasScore(scoreA, scoreB);
      return {
        matchId: `${group}-MD${md}-${teamA}`,
        date,
        kickoffTime: time,
        group,
        teamA,
        teamB,
        venue: place.venue,
        city: place.city,
        status,
        scoreA: showScore ? scoreA : null,
        scoreB: showScore ? scoreB : null,
      };
    }
  );

  // Sort chronologically (date, then kickoff time) for the schedule view.
  return result.sort((a, b) =>
    a.date === b.date
      ? a.kickoffTime.localeCompare(b.kickoffTime)
      : a.date.localeCompare(b.date)
  );
}

export const matches: Match[] = buildMatches();

/**
 * Overlay live/finished results onto the base fixtures, returning a NEW array
 * (only changed matches get new objects, so React memoisation stays cheap).
 * Matches are keyed by the unordered team pair — each pair meets once in the
 * group stage — and scores/live detail are oriented to our home/away ordering.
 */
export function mergeLiveScores(base: Match[], live: LiveMatchWire[]): Match[] {
  if (live.length === 0) return base;
  const byPair = new Map<string, LiveMatchWire>();
  for (const r of live) byPair.set([r.teamA, r.teamB].sort().join("|"), r);

  let changed = false;
  const next = base.map((m) => {
    const r = byPair.get([m.teamA, m.teamB].sort().join("|"));
    if (r?.scoreA == null || r.scoreB == null) return m;
    // Orient the live values to this fixture's teamA/teamB.
    const flip = r.teamA !== m.teamA;
    const scoreA = flip ? r.scoreB : r.scoreA;
    const scoreB = flip ? r.scoreA : r.scoreB;
    const live = r.live ? orientLive(r.live, flip) : undefined;
    if (
      m.scoreA === scoreA &&
      m.scoreB === scoreB &&
      m.status === r.status &&
      JSON.stringify(m.live) === JSON.stringify(live)
    ) {
      return m;
    }
    changed = true;
    return { ...m, scoreA, scoreB, status: r.status, live };
  });
  return changed ? next : base;
}

/** Swap the A/B-specific live fields when the provider's home/away is reversed. */
function orientLive(live: LiveInfo, flip: boolean): LiveInfo {
  if (!flip) return live;
  return {
    ...live,
    halftimeA: live.halftimeB,
    halftimeB: live.halftimeA,
    redCardsA: live.redCardsB,
    redCardsB: live.redCardsA,
  };
}

/** True if any fixture is currently inside its live window (fresh clock read). */
export function isLiveWindowNow(): boolean {
  const today = todayInKickoffTz();
  const now = nowMinutesInKickoffTz();
  return FIXTURES.some(([, , date, time]) => {
    if (date !== today) return false;
    const ko = kickoffToMinutes(time);
    return now >= ko && now < ko + MATCH_DURATION_MINUTES;
  });
}
