import { teams } from "../data/teams";
import { matches } from "../data/matches";
import { teamExtras, type TeamExtra } from "../data/teamExtras";
import type {
  Group,
  KnockoutMatch,
  Match,
  ScoredResult,
  StandingRow,
  StarPlayer,
  Team,
  TournamentStats,
  WinChance,
} from "../types";
export { todayISO } from "./formatters";

// Country facts + full squads are heavy, so their helpers live in
// ./countryData and load on demand with the country panels.

// ---- Lookup maps (built once) ----
const teamByCode = new Map(teams.map((t) => [t.fifaCode, t]));

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

/** All matches involving a given team code (either side). */
export function getMatchesForTeam(
  code: string | null | undefined,
  ms: Match[] = matches
): Match[] {
  if (!code) return [];
  return ms.filter((m) => m.teamA === code || m.teamB === code);
}

/** All teams in a given group. */
export function getTeamsByGroup(group: Group): Team[] {
  return teams.filter((t) => t.group === group);
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
export function computeGroupStandings(
  ms: Match[] = matches
): { group: Group; rows: StandingRow[] }[] {
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

    for (const m of ms) {
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
export function computeTournamentStats(
  ms: Match[] = matches,
  knockout: KnockoutMatch[] = []
): TournamentStats {
  // Goals include extra time; penalty-shootout kicks are not goals.
  const played: ScoredResult[] = [
    ...ms.filter(hasScore).map((m) => ({
      kind: "group" as const,
      id: m.matchId,
      teamA: m.teamA,
      teamB: m.teamB,
      scoreA: m.scoreA as number,
      scoreB: m.scoreB as number,
    })),
    ...knockout.flatMap((k) =>
      k.teamA && k.teamB && k.scoreA !== null && k.scoreB !== null
        ? [{ kind: "ko" as const, id: k.id, teamA: k.teamA, teamB: k.teamB, scoreA: k.scoreA, scoreB: k.scoreB }]
        : []
    ),
  ];
  const totalGoals = played.reduce((sum, m) => sum + m.scoreA + m.scoreB, 0);

  let biggestWin: ScoredResult | null = null;
  let biggestMargin = -1;
  let highestScoring: ScoredResult | null = null;
  let mostGoals = -1;
  for (const m of played) {
    const sa = m.scoreA;
    const sb = m.scoreB;
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
    goalsByTeam.set(m.teamA, (goalsByTeam.get(m.teamA) ?? 0) + m.scoreA);
    goalsByTeam.set(m.teamB, (goalsByTeam.get(m.teamB) ?? 0) + m.scoreB);
  }
  const scoredEntries = Array.from(goalsByTeam.entries())
    .map(([code, goals]) => ({ team: getTeamByCode(code), goals }))
    .filter((x): x is { team: Team; goals: number } => Boolean(x.team) && x.goals > 0)
    .sort((a, b) => b.goals - a.goals);
  const teamsScored = scoredEntries.length;
  const topScorers = scoredEntries.slice(0, 6);

  return {
    totalMatches: ms.length + knockout.length,
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
