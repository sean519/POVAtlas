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
  { name: "Lionel Messi", teamCode: "ARG", goals: 5 },
  { name: "Vinícius Júnior", teamCode: "BRA", goals: 4 },
  { name: "Ousmane Dembélé", teamCode: "FRA", goals: 4 },
  { name: "Kylian Mbappé", teamCode: "FRA", goals: 4 },
  { name: "Erling Haaland", teamCode: "NOR", goals: 4 },
  { name: "Matheus Cunha", teamCode: "BRA", goals: 3 },
  { name: "Jonathan David", teamCode: "CAN", goals: 3 },
  { name: "Yoane Wissa", teamCode: "COD", goals: 3 },
  { name: "Harry Kane", teamCode: "ENG", goals: 3 },
  { name: "Deniz Undav", teamCode: "GER", goals: 3 },
];
