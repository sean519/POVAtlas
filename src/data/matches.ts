import { teams } from "./teams";
import type { Group, Match, MatchStatus } from "../types";
import { todayISO } from "../utils/formatters";

/**
 * 2026 World Cup group-stage schedule.
 *
 * The tournament runs across the USA, Canada and Mexico from 11 June 2026.
 * This builds a realistic full group stage from the team list: 12 groups × 3
 * matchdays × 2 matches = 72 matches, each team playing three games. The
 * opening match is Mexico at Estadio Azteca on 11 June, and final-round
 * matches in a group kick off simultaneously, mirroring the real format.
 *
 * Match status is derived dynamically from the device's current date, so the
 * schedule "updates" day to day: anything before today is finished, today is
 * live, later is upcoming. This is the integration point for a real live feed
 * (see fetchLiveSchedule below). Edit the date/venue tables or the pairings to
 * adjust the fixtures.
 */

// "Current" date (local) used to decide finished / live / upcoming.
const TODAY = todayISO();

const GROUP_ORDER: Group[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

interface Venue {
  venue: string;
  city: string;
}

// Two real host venues per group; the two matches of a matchday use each one.
const groupVenues: Record<Group, [Venue, Venue]> = {
  A: [
    { venue: "Estadio Azteca", city: "Mexico City" },
    { venue: "Estadio Akron", city: "Guadalajara" },
  ],
  B: [
    { venue: "BMO Field", city: "Toronto" },
    { venue: "BC Place", city: "Vancouver" },
  ],
  C: [
    { venue: "MetLife Stadium", city: "New York / New Jersey" },
    { venue: "Gillette Stadium", city: "Boston" },
  ],
  D: [
    { venue: "SoFi Stadium", city: "Los Angeles" },
    { venue: "Levi's Stadium", city: "San Francisco Bay Area" },
  ],
  E: [
    { venue: "Arrowhead Stadium", city: "Kansas City" },
    { venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  ],
  F: [
    { venue: "AT&T Stadium", city: "Dallas" },
    { venue: "NRG Stadium", city: "Houston" },
  ],
  G: [
    { venue: "Hard Rock Stadium", city: "Miami" },
    { venue: "Lincoln Financial Field", city: "Philadelphia" },
  ],
  H: [
    { venue: "Estadio BBVA", city: "Monterrey" },
    { venue: "Lumen Field", city: "Seattle" },
  ],
  I: [
    { venue: "MetLife Stadium", city: "New York / New Jersey" },
    { venue: "Levi's Stadium", city: "San Francisco Bay Area" },
  ],
  J: [
    { venue: "SoFi Stadium", city: "Los Angeles" },
    { venue: "Arrowhead Stadium", city: "Kansas City" },
  ],
  K: [
    { venue: "Mercedes-Benz Stadium", city: "Atlanta" },
    { venue: "AT&T Stadium", city: "Dallas" },
  ],
  L: [
    { venue: "Gillette Stadium", city: "Boston" },
    { venue: "Hard Rock Stadium", city: "Miami" },
  ],
};

// Matchday dates per group (indexed by GROUP_ORDER position). June 2026.
const matchdayDates: Record<1 | 2 | 3, string[]> = {
  1: [11, 12, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17].map(june),
  2: [18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23].map(june),
  3: [24, 24, 24, 25, 25, 25, 26, 26, 26, 27, 27, 27].map(june),
};

// Kickoff slots: matchdays 1 & 2 have two staggered times; matchday 3 is
// simultaneous (both matches at the same time).
const matchdayTimes: Record<1 | 2 | 3, [string, string]> = {
  1: ["13:00", "16:00"],
  2: ["16:00", "19:00"],
  3: ["18:00", "18:00"],
};

// Round-robin pairings (indices into a group's four teams). Covers all 6 games.
const pairings: Record<1 | 2 | 3, [number, number][]> = {
  1: [
    [0, 1],
    [2, 3],
  ],
  2: [
    [0, 2],
    [1, 3],
  ],
  3: [
    [0, 3],
    [1, 2],
  ],
};

function june(day: number): string {
  return `2026-06-${String(day).padStart(2, "0")}`;
}

function statusFor(date: string): MatchStatus {
  if (date < TODAY) return "finished";
  if (date === TODAY) return "live";
  return "scheduled";
}

// Deterministic small scoreline so finished/live results are stable.
function pseudoScore(seed: number): [number, number] {
  return [(seed * 3 + 1) % 4, (seed * 5 + 2) % 4];
}

function buildMatches(): Match[] {
  const result: Match[] = [];
  let seed = 0;

  GROUP_ORDER.forEach((group, gi) => {
    const groupTeams = teams.filter((t) => t.group === group);
    ([1, 2, 3] as const).forEach((md) => {
      const date = matchdayDates[md][gi];
      const status = statusFor(date);

      pairings[md].forEach(([ai, bi], i) => {
        const teamA = groupTeams[ai];
        const teamB = groupTeams[bi];
        const place = groupVenues[group][i];
        const scored = status !== "scheduled";
        const [scoreA, scoreB] = scored ? pseudoScore(seed) : [null, null];

        result.push({
          matchId: `${group}-MD${md}-${i + 1}`,
          date,
          kickoffTime: matchdayTimes[md][i],
          group,
          teamA: teamA.fifaCode,
          teamB: teamB.fifaCode,
          venue: place.venue,
          city: place.city,
          status,
          scoreA,
          scoreB,
        });
        seed += 1;
      });
    });
  });

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
 * official or licensed feed and returns the same `Match[]` shape. Wire it up by
 * replacing the static `matches` export with the result of this function.
 *
 * Example:
 *   const live = await fetchLiveSchedule("/api/wc2026/matches");
 *   // then store `live` in React state and render it instead of `matches`.
 */
export async function fetchLiveSchedule(
  endpoint: string
): Promise<Match[]> {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Schedule fetch failed: HTTP ${res.status}`);
  return (await res.json()) as Match[];
}
