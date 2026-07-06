/**
 * Golden Boot race — leading goal-scorers of the 2026 World Cup.
 *
 * Real tournament data, auto-refreshed from Wikipedia's goalscorers module
 * (Module:Goalscorers/data/2026 FIFA World Cup) by scripts/refresh-results.mjs.
 * `teamCode` is a team `fifaCode` so the UI can render the right flag.
 */
export interface ScorerEntry {
  name: string;
  teamCode: string;
  goals: number;
}

export const topScorers: ScorerEntry[] = [
  { name: "Lionel Messi", teamCode: "ARG", goals: 7 },
  { name: "Kylian Mbappé", teamCode: "FRA", goals: 7 },
  { name: "Erling Haaland", teamCode: "NOR", goals: 7 },
  { name: "Harry Kane", teamCode: "ENG", goals: 6 },
  { name: "Vinícius Júnior", teamCode: "BRA", goals: 4 },
  { name: "Jude Bellingham", teamCode: "ENG", goals: 4 },
  { name: "Ousmane Dembélé", teamCode: "FRA", goals: 4 },
  { name: "Julián Quiñones", teamCode: "MEX", goals: 4 },
  { name: "Ismaïla Sarr", teamCode: "SEN", goals: 4 },
  { name: "Mikel Oyarzabal", teamCode: "ESP", goals: 4 },
];
