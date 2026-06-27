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

/** A single in-match event surfaced from a live provider. */
export interface LiveEvent {
  /** fifaCode of the team involved. */
  team: string;
  type: "goal" | "red-card";
  /** Minute it happened (best-effort). */
  minute: number | null;
  player?: string;
}

/** Live detail for an in-progress / just-finished match. */
export interface LiveInfo {
  /** Provider's stage, normalised: e.g. "1H","HT","2H","ET","PEN","FT". */
  stage: string;
  /** Elapsed minutes while in play (null otherwise). */
  minute: number | null;
  halftimeA: number | null;
  halftimeB: number | null;
  redCardsA: number;
  redCardsB: number;
  events: LiveEvent[];
}

/** Provider-agnostic live result for one fixture (the API wire shape). */
export interface LiveMatchWire {
  /** fifaCode of each side (already matched to our team data). */
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
  live?: LiveInfo;
}

/** Response shape of the `/api/live-scores` route. */
export interface LiveScoresResponse {
  /** ISO timestamp the data was produced/cached. */
  updatedAt: string;
  /** Which provider served it (e.g. "api-football", "thesportsdb", "cache"). */
  source: string;
  /** True when served from cache after a live fetch failed. */
  stale: boolean;
  matches: LiveMatchWire[];
}

/** Outfield position bucket used to group a full match-day squad. */
export type SquadPosition = "GK" | "DF" | "MF" | "FW";

/**
 * One member of a national team's full 26-player World Cup squad.
 * Lighter than `StarPlayer`: just the roster facts (no fame/buzz). A member who
 * is also a curated star is linked to their `StarPlayer` profile by name.
 */
export interface SquadMember {
  /** Shirt number (1-26). */
  number: number;
  name: string;
  position: SquadPosition;
  /** Club the player was at when the squad was announced. */
  club: string;
}

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
  /** Match with the most combined goals. */
  highestScoring: Match | null;
  /** Number of distinct teams that have scored at least one goal. */
  teamsScored: number;
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
  /** Present when a live provider has in-match detail for this fixture. */
  live?: LiveInfo;
}

/** Knockout-stage round, in bracket order. */
export type KnockoutRound = "R32" | "R16" | "QF" | "SF" | "3P" | "Final";

/**
 * One knockout-stage match, parsed live from Wikipedia. Teams are `null` until
 * the bracket is decided (group stage / prior round), in which case `labelA` /
 * `labelB` carry the placeholder (e.g. "Winner Match 73"). Scores are `null`
 * until played.
 */
export interface KnockoutMatch {
  /** Stable id: round + position in the bracket, e.g. "R16-1". */
  id: string;
  round: KnockoutRound;
  /** ISO date, e.g. "2026-07-04". */
  date: string;
  /** fifaCode once known, else null. */
  teamA: string | null;
  teamB: string | null;
  /** Placeholder text shown when the team isn't decided yet. */
  labelA: string;
  labelB: string;
  scoreA: number | null;
  scoreB: number | null;
}

/** Response shape of the `/api/knockout` route. */
export interface KnockoutResponse {
  updatedAt: string;
  source: string;
  stale: boolean;
  matches: KnockoutMatch[];
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
  /** A few famous tourist attractions, each with a one-line description. */
  topAttractions?: { name: string; blurb: string }[];
}

export interface CountryComparison {
  teamA: Team;
  teamB: Team;
  factsA: CountryFacts | undefined;
  factsB: CountryFacts | undefined;
  summary: string;
}
