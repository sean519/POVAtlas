/**
 * Golden Boot race — leading goal-scorers of the 2026 group stage.
 *
 * Player goal tallies are illustrative and consistent with the simulated
 * scorelines in `matches.ts` (not verified official data). `teamCode` is a
 * team `fifaCode` so the UI can render the right flag.
 */
export interface ScorerEntry {
  name: string;
  teamCode: string;
  goals: number;
}

export const topScorers: ScorerEntry[] = [
  { name: "Harry Kane", teamCode: "ENG", goals: 4 },
  { name: "Erling Haaland", teamCode: "NOR", goals: 4 },
  { name: "Kylian Mbappé", teamCode: "FRA", goals: 3 },
  { name: "Cristiano Ronaldo", teamCode: "POR", goals: 3 },
  { name: "Florian Wirtz", teamCode: "GER", goals: 3 },
  { name: "Alexander Isak", teamCode: "SWE", goals: 3 },
  { name: "Cody Gakpo", teamCode: "NED", goals: 3 },
  { name: "Christian Pulisic", teamCode: "USA", goals: 2 },
  { name: "Kaoru Mitoma", teamCode: "JPN", goals: 2 },
  { name: "Luis Díaz", teamCode: "COL", goals: 2 },
];
