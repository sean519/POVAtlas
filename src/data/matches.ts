import type { Group, Match, MatchStatus } from "../types";
import { todayISO } from "../utils/formatters";

/**
 * 2026 FIFA World Cup group-stage schedule (USA · Canada · Mexico).
 *
 * 12 groups × 3 matchdays = 72 matches, June 11–27 2026. Dates, kickoff
 * pairings, venues and scorelines follow the published tournament schedule
 * and results. Matchday 3 of the early groups (A/B/C) falls on June 24.
 *
 * Match status is derived from the device's current date, so the schedule
 * "updates" day to day: finished before today, live today, upcoming after.
 * Scores are attached to matches that have already been played.
 */

const TODAY = todayISO();

function statusFor(date: string): MatchStatus {
  if (date < TODAY) return "finished";
  if (date === TODAY) return "live";
  return "scheduled";
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

const FIXTURES: Fixture[] = [
  // ---- Group A (MEX, RSA, KOR, CZE) ----
  ["A", 1, "2026-06-11", "19:00", "MEX", "RSA", "AZT", 2, 0],
  ["A", 1, "2026-06-11", "22:00", "KOR", "CZE", "AKR", 2, 1],
  ["A", 2, "2026-06-18", "15:00", "CZE", "RSA", "MBENZ", 1, 1],
  ["A", 2, "2026-06-18", "21:00", "MEX", "KOR", "AKR", 1, 0],
  ["A", 3, "2026-06-24", "17:00", "MEX", "CZE", "AZT", null, null],
  ["A", 3, "2026-06-24", "17:00", "RSA", "KOR", "AKR", null, null],

  // ---- Group B (CAN, BIH, QAT, SUI) ----
  ["B", 1, "2026-06-12", "18:00", "CAN", "BIH", "BMO", 1, 1],
  ["B", 1, "2026-06-13", "15:00", "QAT", "SUI", "LEVIS", 1, 1],
  ["B", 2, "2026-06-18", "18:00", "SUI", "BIH", "SOFI", 4, 1],
  ["B", 2, "2026-06-18", "21:00", "CAN", "QAT", "BC", 6, 0],
  ["B", 3, "2026-06-24", "14:00", "CAN", "SUI", "BMO", null, null],
  ["B", 3, "2026-06-24", "14:00", "BIH", "QAT", "BC", null, null],

  // ---- Group C (BRA, MAR, HTI, SCO) ----
  ["C", 1, "2026-06-13", "18:00", "BRA", "MAR", "METLIFE", 1, 1],
  ["C", 1, "2026-06-13", "15:00", "HTI", "SCO", "GILLETTE", 0, 1],
  ["C", 2, "2026-06-19", "15:00", "SCO", "MAR", "GILLETTE", 0, 1],
  ["C", 2, "2026-06-19", "18:00", "BRA", "HTI", "LINC", 3, 0],
  ["C", 3, "2026-06-24", "18:00", "SCO", "BRA", "HARDROCK", null, null],
  ["C", 3, "2026-06-24", "18:00", "MAR", "HTI", "MBENZ", null, null],

  // ---- Group D (USA, PAR, AUS, TUR) ----
  ["D", 1, "2026-06-12", "21:00", "USA", "PAR", "SOFI", 4, 1],
  ["D", 1, "2026-06-13", "18:00", "AUS", "TUR", "BC", 2, 0],
  ["D", 2, "2026-06-19", "19:00", "USA", "AUS", "LUMEN", 2, 0],
  ["D", 2, "2026-06-19", "16:00", "TUR", "PAR", "LEVIS", 0, 1],
  ["D", 3, "2026-06-25", "18:00", "USA", "TUR", "SOFI", null, null],
  ["D", 3, "2026-06-25", "18:00", "PAR", "AUS", "LEVIS", null, null],

  // ---- Group E (GER, CUW, CIV, ECU) ----
  ["E", 1, "2026-06-14", "15:00", "GER", "CUW", "NRG", 7, 1],
  ["E", 1, "2026-06-14", "18:00", "CIV", "ECU", "LINC", 1, 0],
  ["E", 2, "2026-06-20", "15:00", "GER", "CIV", "BMO", 2, 1],
  ["E", 2, "2026-06-20", "18:00", "ECU", "CUW", "ARROW", 0, 0],
  ["E", 3, "2026-06-25", "16:00", "ECU", "GER", "METLIFE", null, null],
  ["E", 3, "2026-06-25", "16:00", "CUW", "CIV", "LINC", null, null],

  // ---- Group F (NED, JPN, SWE, TUN) ----
  ["F", 1, "2026-06-14", "21:00", "NED", "JPN", "ATT", 2, 2],
  ["F", 1, "2026-06-14", "18:00", "SWE", "TUN", "BBVA", 5, 1],
  ["F", 2, "2026-06-20", "21:00", "NED", "SWE", "NRG", 5, 1],
  ["F", 2, "2026-06-20", "18:00", "TUN", "JPN", "BBVA", 0, 4],
  ["F", 3, "2026-06-25", "19:00", "JPN", "SWE", "ATT", null, null],
  ["F", 3, "2026-06-25", "19:00", "TUN", "NED", "ARROW", null, null],

  // ---- Group G (BEL, EGY, IRI, NZL) ----
  ["G", 1, "2026-06-15", "15:00", "BEL", "EGY", "LUMEN", 1, 1],
  ["G", 1, "2026-06-15", "18:00", "IRI", "NZL", "SOFI", 2, 2],
  ["G", 2, "2026-06-21", "18:00", "BEL", "IRI", "SOFI", 0, 0],
  ["G", 2, "2026-06-21", "15:00", "NZL", "EGY", "BC", 1, 3],
  ["G", 3, "2026-06-26", "18:00", "EGY", "IRI", "LUMEN", null, null],
  ["G", 3, "2026-06-26", "18:00", "NZL", "BEL", "BC", null, null],

  // ---- Group H (ESP, CPV, KSA, URU) ----
  ["H", 1, "2026-06-15", "15:00", "ESP", "CPV", "MBENZ", 0, 0],
  ["H", 1, "2026-06-15", "18:00", "KSA", "URU", "HARDROCK", 1, 1],
  ["H", 2, "2026-06-21", "18:00", "ESP", "KSA", "MBENZ", 4, 0],
  ["H", 2, "2026-06-21", "15:00", "URU", "CPV", "HARDROCK", 2, 2],
  ["H", 3, "2026-06-26", "15:00", "CPV", "KSA", "NRG", null, null],
  ["H", 3, "2026-06-26", "17:00", "URU", "ESP", "AKR", null, null],

  // ---- Group I (FRA, SEN, IRQ, NOR) ----
  ["I", 1, "2026-06-16", "18:00", "FRA", "SEN", "METLIFE", 3, 1],
  ["I", 1, "2026-06-16", "15:00", "IRQ", "NOR", "GILLETTE", 1, 4],
  ["I", 2, "2026-06-22", "18:00", "FRA", "IRQ", "LINC", 3, 0],
  ["I", 2, "2026-06-22", "15:00", "NOR", "SEN", "METLIFE", 3, 2],
  ["I", 3, "2026-06-26", "15:00", "NOR", "FRA", "GILLETTE", null, null],
  ["I", 3, "2026-06-26", "15:00", "SEN", "IRQ", "BMO", null, null],

  // ---- Group J (ARG, DZA, AUT, JOR) ----
  ["J", 1, "2026-06-16", "21:00", "ARG", "DZA", "ARROW", 3, 0],
  ["J", 1, "2026-06-16", "18:00", "AUT", "JOR", "LEVIS", 3, 1],
  ["J", 2, "2026-06-22", "21:00", "ARG", "AUT", "ATT", 2, 0],
  ["J", 2, "2026-06-22", "18:00", "JOR", "DZA", "LEVIS", 1, 2],
  ["J", 3, "2026-06-27", "21:00", "DZA", "AUT", "ARROW", null, null],
  ["J", 3, "2026-06-27", "21:00", "JOR", "ARG", "ATT", null, null],

  // ---- Group K (POR, COD, UZB, COL) ----
  ["K", 1, "2026-06-17", "18:00", "POR", "COD", "NRG", 1, 1],
  ["K", 1, "2026-06-17", "15:00", "UZB", "COL", "AZT", 1, 3],
  ["K", 2, "2026-06-23", "18:00", "POR", "UZB", "NRG", 5, 0],
  ["K", 2, "2026-06-23", "15:00", "COL", "COD", "AKR", 1, 0],
  ["K", 3, "2026-06-27", "19:30", "COL", "POR", "HARDROCK", null, null],
  ["K", 3, "2026-06-27", "19:30", "COD", "UZB", "MBENZ", null, null],

  // ---- Group L (ENG, CRO, GHA, PAN) ----
  ["L", 1, "2026-06-17", "18:00", "ENG", "CRO", "ATT", 4, 2],
  ["L", 1, "2026-06-17", "15:00", "GHA", "PAN", "BMO", 1, 0],
  ["L", 2, "2026-06-23", "15:00", "ENG", "GHA", "GILLETTE", 0, 0],
  ["L", 2, "2026-06-23", "18:00", "PAN", "CRO", "BMO", 0, 1],
  ["L", 3, "2026-06-27", "17:00", "PAN", "ENG", "METLIFE", null, null],
  ["L", 3, "2026-06-27", "17:00", "CRO", "GHA", "LINC", null, null],
];

function buildMatches(): Match[] {
  const result: Match[] = FIXTURES.map(
    ([group, md, date, time, teamA, teamB, venueKey, scoreA, scoreB]) => {
      const status = statusFor(date);
      const place = VENUES[venueKey];
      // Only keep scores for matches that have actually been played.
      const played = status === "finished";
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
        scoreA: played ? scoreA : null,
        scoreB: played ? scoreB : null,
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
 * Integration point for a REAL live schedule / scores.
 *
 * A pure front-end app cannot scrape fifa.com directly (CORS + no public API),
 * so production should call your own small backend / proxy that fetches an
 * official or licensed feed and returns the same `Match[]` shape.
 */
export async function fetchLiveSchedule(endpoint: string): Promise<Match[]> {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Schedule fetch failed: HTTP ${res.status}`);
  return (await res.json()) as Match[];
}
