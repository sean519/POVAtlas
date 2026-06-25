import { teams } from "../data/teams";

/**
 * Resolve a provider's team name to our `fifaCode`. Shared by every live-score
 * provider (API-Football, TheSportsDB, …) so name handling lives in one place.
 */

/** Normalise a country/team name: strip accents + punctuation, lowercase. */
export function normName(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const NAME_TO_CODE: Record<string, string> = {};
for (const t of teams) {
  NAME_TO_CODE[normName(t.teamName)] = t.fifaCode;
  NAME_TO_CODE[normName(t.countryName)] = t.fifaCode;
}

// Provider spellings that differ from ours (normalised key → fifaCode).
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
  republicofkorea: "KOR",
  iranislamicrepublic: "IRI",
  iririran: "IRI",
  capeverdeislands: "CPV",
  ivorycoast: "CIV",
  cotedivoire: "CIV",
};
for (const [k, v] of Object.entries(ALIASES)) NAME_TO_CODE[k] = v;

/** Returns the fifaCode for a provider team name, or undefined if unknown. */
export function codeForName(name: string | null | undefined): string | undefined {
  if (!name) return undefined;
  return NAME_TO_CODE[normName(name)];
}
