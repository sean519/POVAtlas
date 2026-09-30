import { countryFacts } from "../data/countryFacts";
import { squads } from "../data/squads";
import type { CountryComparison, CountryFacts, SquadMember, Team } from "../types";
import { getTeamByCode } from "./dataHelpers";
import { formatGDP, formatPopulation } from "./formatters";

/**
 * Helpers backed by the two heaviest data files (country facts, full squads).
 * Kept apart from dataHelpers so these files load on demand with the country
 * panels instead of in the initial bundle — import only from lazily loaded
 * components.
 */

const factsByIso = new Map(countryFacts.map((f) => [f.isoA3Code, f]));

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

/**
 * Full 26-player squad for a team (empty array if not curated yet). The Squad
 * tab uses this; when empty it falls back to the curated star players.
 */
export function getSquad(code: string | null | undefined): SquadMember[] {
  if (!code) return [];
  return squads[code] ?? [];
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
