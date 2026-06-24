// Shared domain types for the World Cup Geography Map app.

export type Group =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export type Continent =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania";

export type MatchStatus = "scheduled" | "live" | "finished";

export interface StarPlayer {
  name: string;
  position: string;
  /** One short, kid-friendly line about the player. */
  note: string;
  /** Popularity score (higher = more famous) used to rank the Players tab. */
  fame: number;
  /** Approximate age (as of 2026). */
  age?: number;
  /** Marital status, e.g. "Married", "In a relationship", "Single". */
  marital?: string;
  /** Number of children (omit if unknown / private). */
  children?: number;
  /** A few light, illustrative "buzz" lines (not verified news). */
  buzz?: string[];
}

/** Win-chance estimate for a single match (percentages, sum ~100). */
export interface WinChance {
  a: number;
  draw: number;
  b: number;
}

/** A single row in a group standings table. */
export interface StandingRow {
  team: Team;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

/** Tournament-wide aggregate statistics. */
export interface TournamentStats {
  totalMatches: number;
  playedMatches: number;
  totalGoals: number;
  avgGoals: number;
  biggestWin: Match | null;
  topScorers: { team: Team; goals: number }[];
}

export interface Team {
  teamName: string;
  countryName: string;
  /** Chinese (Simplified) name of the country / team. */
  nameZh: string;
  /** Code used by the schedule / shown on badges (may differ from ISO). */
  fifaCode: string;
  /** ISO 3166-1 alpha-3 code, used to match GeoJSON polygons. */
  isoA3Code: string;
  /** ISO 3166-1 alpha-2 code (lowercase), used to load the flag image. */
  iso2: string;
  group: Group;
  /** Emoji flag — kept as a text fallback; the UI renders real flag images. */
  flagEmoji: string;
  continent: Continent;
  region: string;
  lat: number;
  lng: number;
  /** False for football nations that are not sovereign UN states (e.g. England). */
  isSovereignCountry: boolean;
  /** Optional note explaining boundary / mapping caveats. */
  specialBoundaryNote?: string;
}

export interface Match {
  matchId: string;
  /** ISO date string, e.g. "2026-06-11". */
  date: string;
  /** Local kickoff time, e.g. "18:00". */
  kickoffTime: string;
  group: Group;
  /** fifaCode of team A. */
  teamA: string;
  /** fifaCode of team B. */
  teamB: string;
  venue: string;
  city: string;
  status: MatchStatus;
  scoreA: number | null;
  scoreB: number | null;
}

export interface CountryFacts {
  isoA3Code: string;
  countryName: string;
  capital: string;
  population: number;
  gdpUsd: number;
  gdpPerCapitaUsd: number;
  areaKm2: number;
  languages: string[];
  currency: string;
  region: Continent;
  subregion: string;
  neighbors: string[];
  shortIntro: string;
  funFacts: string[];
  kidSummary: string;
}

export interface CountryComparison {
  teamA: Team;
  teamB: Team;
  factsA: CountryFacts | undefined;
  factsB: CountryFacts | undefined;
  summary: string;
}
