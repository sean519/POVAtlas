import { teams } from "../data/teams";
import { matches } from "../data/matches";
import { countryFacts } from "../data/countryFacts";
import { teamExtras, type TeamExtra } from "../data/teamExtras";
import type {
  CountryComparison,
  CountryFacts,
  Group,
  Match,
  StandingRow,
  StarPlayer,
  Team,
  TournamentStats,
  WinChance,
} from "../types";
import { formatGDP, formatPopulation } from "./formatters";

export { todayISO } from "./formatters";

// ---- Lookup maps (built once) ----
const teamByCode = new Map(teams.map((t) => [t.fifaCode, t]));
const factsByIso = new Map(countryFacts.map((f) => [f.isoA3Code, f]));

export const ALL_GROUPS: Group[] = [
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

/** Get a team by its FIFA code. */
export function getTeamByCode(code: string | null | undefined): Team | undefined {
  if (!code) return undefined;
  return teamByCode.get(code);
}

/** Get country facts by ISO A3 code. */
export function getCountryFactsByIso(
  iso: string | null | undefined
): CountryFacts | undefined {
  if (!iso) return undefined;
  return factsByIso.get(iso);
}

/** Get country facts for a team (resolves the team's ISO code first). */
export function getFactsForTeam(
  code: string | null | undefined
): CountryFacts | undefined {
  const team = getTeamByCode(code);
  return team ? getCountryFactsByIso(team.isoA3Code) : undefined;
}

/** All matches involving a given team code (either side). */
export function getMatchesForTeam(code: string | null | undefined): Match[] {
  if (!code) return [];
  return matches.filter((m) => m.teamA === code || m.teamB === code);
}

/** All teams in a given group. */
export function getTeamsByGroup(group: Group): Team[] {
  return teams.filter((t) => t.group === group);
}

/**
 * Build a kid-friendly comparison between two teams' countries.
 */
export function compareCountries(
  codeA: string,
  codeB: string
): CountryComparison | null {
  const teamA = getTeamByCode(codeA);
  const teamB = getTeamByCode(codeB);
  if (!teamA || !teamB) return null;

  const factsA = getCountryFactsByIso(teamA.isoA3Code);
  const factsB = getCountryFactsByIso(teamB.isoA3Code);

  return {
    teamA,
    teamB,
    factsA,
    factsB,
    summary: buildComparisonSummary(teamA, teamB, factsA, factsB),
  };
}

function buildComparisonSummary(
  teamA: Team,
  teamB: Team,
  factsA: CountryFacts | undefined,
  factsB: CountryFacts | undefined
): string {
  if (!factsA || !factsB) {
    return `${teamA.teamName} and ${teamB.teamName} both bring their own football story to the World Cup.`;
  }

  const parts: string[] = [];

  // Economy comparison
  if (factsA.gdpUsd !== factsB.gdpUsd) {
    const bigger = factsA.gdpUsd > factsB.gdpUsd ? factsA : factsB;
    const smaller = factsA.gdpUsd > factsB.gdpUsd ? factsB : factsA;
    const ratio = bigger.gdpUsd / Math.max(smaller.gdpUsd, 1);
    const sizeWord = ratio >= 4 ? "much larger" : "larger";
    parts.push(
      `${bigger.countryName} has a ${sizeWord} economy (${formatGDP(
        bigger.gdpUsd
      )} vs ${formatGDP(smaller.gdpUsd)})`
    );
  }

  // Population comparison
  if (factsA.population !== factsB.population) {
    const bigger = factsA.population > factsB.population ? factsA : factsB;
    const smaller = factsA.population > factsB.population ? factsB : factsA;
    parts.push(
      `${bigger.countryName} has more people (${formatPopulation(
        bigger.population
      )}) than ${smaller.countryName} (${formatPopulation(
        smaller.population
      )})`
    );
  }

  const lead = parts.length
    ? `${capitalize(parts[0])}.`
    : `${teamA.countryName} and ${teamB.countryName} are quite similar in size.`;

  const second =
    parts.length > 1 ? ` ${capitalize(parts[1])}.` : "";

  return `${lead}${second} But on the football pitch, size doesn't decide the winner — every team has a real chance, and both ${teamA.teamName} and ${teamB.teamName} have proud football traditions.`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Star players + strength rating for a team. */
export function getTeamExtras(
  code: string | null | undefined
): TeamExtra | undefined {
  if (!code) return undefined;
  return teamExtras[code];
}

/** Star players for a team (empty array if none). */
export function getStarPlayers(code: string | null | undefined): StarPlayer[] {
  return getTeamExtras(code)?.starPlayers ?? [];
}

/** True once a match has a usable score (finished or live in progress). */
function hasScore(m: Match): boolean {
  return m.scoreA !== null && m.scoreB !== null;
}

/**
 * Group standings (W/D/L, goals, points) computed from played matches.
 * One entry per group; rows sorted by points, then goal difference, then GF.
 */
export function computeGroupStandings(): { group: Group; rows: StandingRow[] }[] {
  return ALL_GROUPS.map((group) => {
    const rows = new Map<string, StandingRow>();
    for (const t of getTeamsByGroup(group)) {
      rows.set(t.fifaCode, {
        team: t,
        played: 0,
        win: 0,
        draw: 0,
        loss: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
      });
    }

    for (const m of matches) {
      if (m.group !== group || !hasScore(m)) continue;
      const a = rows.get(m.teamA);
      const b = rows.get(m.teamB);
      if (!a || !b) continue;
      const sa = m.scoreA as number;
      const sb = m.scoreB as number;
      a.played++;
      b.played++;
      a.gf += sa;
      a.ga += sb;
      b.gf += sb;
      b.ga += sa;
      if (sa > sb) {
        a.win++;
        a.points += 3;
        b.loss++;
      } else if (sa < sb) {
        b.win++;
        b.points += 3;
        a.loss++;
      } else {
        a.draw++;
        b.draw++;
        a.points += 1;
        b.points += 1;
      }
    }

    const list = Array.from(rows.values());
    for (const r of list) r.gd = r.gf - r.ga;
    list.sort(
      (x, y) =>
        y.points - x.points ||
        y.gd - x.gd ||
        y.gf - x.gf ||
        x.team.teamName.localeCompare(y.team.teamName)
    );
    return { group, rows: list };
  });
}

/** Tournament-wide aggregate stats computed from played matches. */
export function computeTournamentStats(): TournamentStats {
  const played = matches.filter(hasScore);
  const totalGoals = played.reduce(
    (sum, m) => sum + (m.scoreA as number) + (m.scoreB as number),
    0
  );

  let biggestWin: Match | null = null;
  let biggestMargin = -1;
  let highestScoring: Match | null = null;
  let mostGoals = -1;
  for (const m of played) {
    const sa = m.scoreA as number;
    const sb = m.scoreB as number;
    const margin = Math.abs(sa - sb);
    if (margin > biggestMargin) {
      biggestMargin = margin;
      biggestWin = m;
    }
    const total = sa + sb;
    if (total > mostGoals) {
      mostGoals = total;
      highestScoring = m;
    }
  }

  const goalsByTeam = new Map<string, number>();
  for (const m of played) {
    goalsByTeam.set(m.teamA, (goalsByTeam.get(m.teamA) ?? 0) + (m.scoreA as number));
    goalsByTeam.set(m.teamB, (goalsByTeam.get(m.teamB) ?? 0) + (m.scoreB as number));
  }
  const scoredEntries = Array.from(goalsByTeam.entries())
    .map(([code, goals]) => ({ team: getTeamByCode(code), goals }))
    .filter((x): x is { team: Team; goals: number } => Boolean(x.team) && x.goals > 0)
    .sort((a, b) => b.goals - a.goals);
  const teamsScored = scoredEntries.length;
  const topScorers = scoredEntries.slice(0, 6);

  return {
    totalMatches: matches.length,
    playedMatches: played.length,
    totalGoals,
    avgGoals: played.length ? totalGoals / played.length : 0,
    biggestWin,
    highestScoring,
    teamsScored,
    topScorers,
  };
}

/** Flat list of every team's star players (for the Players tab). */
export function getAllStarPlayers(): { team: Team; player: StarPlayer }[] {
  const out: { team: Team; player: StarPlayer }[] = [];
  for (const t of teams) {
    for (const p of getStarPlayers(t.fifaCode)) out.push({ team: t, player: p });
  }
  return out;
}

/**
 * Estimated win-chance for a match, derived from the two teams' strength
 * ratings with an Elo-style expected-score formula plus a draw allowance.
 * Returns whole-number percentages that sum to 100. This is a learning
 * estimate, NOT live betting odds.
 */
export function matchWinChance(
  codeA: string,
  codeB: string
): WinChance | null {
  const ea = teamExtras[codeA];
  const eb = teamExtras[codeB];
  if (!ea || !eb) return null;

  const expA = 1 / (1 + Math.pow(10, -(ea.strength - eb.strength) / 40));
  const drawShare = 0.26 * (1 - Math.abs(expA - 0.5) * 2); // most likely when even
  const a = Math.round(expA * (1 - drawShare) * 100);
  const draw = Math.round(drawShare * 100);
  const b = 100 - a - draw; // keep the total at exactly 100
  return { a, draw, b };
}
