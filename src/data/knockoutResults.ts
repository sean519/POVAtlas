import type { KnockoutMatch } from "../types";

/**
 * Final 2026 World Cup knockout bracket (R32 → Final), frozen after the
 * tournament ended. Generated from the /api/knockout feed plus the extra-time
 * and penalty-shootout fields of the Wikipedia football boxes — not hand-typed.
 *
 * Used when /api/knockout is unavailable (local dev, Wikipedia outage, or the
 * Wikipedia pages being restructured after the tournament).
 */
export const KNOCKOUT_RESULTS: KnockoutMatch[] = [
  { id: "R32-1", round: "R32", date: "2026-06-28", kickoffTime: "12:00", venue: "SoFi Stadium", city: "Inglewood", teamA: "RSA", teamB: "CAN", labelA: "", labelB: "", scoreA: 0, scoreB: 1 },
  { id: "R32-2", round: "R32", date: "2026-06-29", kickoffTime: "10:00", venue: "NRG Stadium", city: "Houston", teamA: "BRA", teamB: "JPN", labelA: "", labelB: "", scoreA: 2, scoreB: 1 },
  { id: "R32-3", round: "R32", date: "2026-06-29", kickoffTime: "13:30", venue: "Gillette Stadium", city: "Foxborough", teamA: "GER", teamB: "PAR", labelA: "", labelB: "", scoreA: 1, scoreB: 1, aet: true, penA: 3, penB: 4 },
  { id: "R32-4", round: "R32", date: "2026-06-29", kickoffTime: "18:00", venue: "Estadio BBVA", city: "Guadalupe", teamA: "NED", teamB: "MAR", labelA: "", labelB: "", scoreA: 1, scoreB: 1, aet: true, penA: 2, penB: 3 },
  { id: "R32-5", round: "R32", date: "2026-06-30", kickoffTime: "10:00", venue: "AT&T Stadium", city: "Arlington", teamA: "CIV", teamB: "NOR", labelA: "", labelB: "", scoreA: 1, scoreB: 2 },
  { id: "R32-6", round: "R32", date: "2026-06-30", kickoffTime: "14:00", venue: "MetLife Stadium", city: "East Rutherford", teamA: "FRA", teamB: "SWE", labelA: "", labelB: "", scoreA: 3, scoreB: 0 },
  { id: "R32-7", round: "R32", date: "2026-06-30", kickoffTime: "19:00", venue: "Estadio Azteca", city: "Mexico City", teamA: "MEX", teamB: "ECU", labelA: "", labelB: "", scoreA: 2, scoreB: 0 },
  { id: "R32-8", round: "R32", date: "2026-07-01", kickoffTime: "09:00", venue: "Mercedes-Benz Stadium", city: "Atlanta", teamA: "ENG", teamB: "COD", labelA: "", labelB: "", scoreA: 2, scoreB: 1 },
  { id: "R32-9", round: "R32", date: "2026-07-01", kickoffTime: "13:00", venue: "Lumen Field", city: "Seattle", teamA: "BEL", teamB: "SEN", labelA: "", labelB: "", scoreA: 3, scoreB: 2, aet: true },
  { id: "R32-10", round: "R32", date: "2026-07-01", kickoffTime: "17:00", venue: "Levi's Stadium", city: "Santa Clara", teamA: "USA", teamB: "BIH", labelA: "", labelB: "", scoreA: 2, scoreB: 0 },
  { id: "R32-11", round: "R32", date: "2026-07-02", kickoffTime: "12:00", venue: "SoFi Stadium", city: "Inglewood", teamA: "ESP", teamB: "AUT", labelA: "", labelB: "", scoreA: 3, scoreB: 0 },
  { id: "R32-12", round: "R32", date: "2026-07-02", kickoffTime: "16:00", venue: "BMO Field", city: "Toronto", teamA: "POR", teamB: "CRO", labelA: "", labelB: "", scoreA: 2, scoreB: 1 },
  { id: "R32-13", round: "R32", date: "2026-07-02", kickoffTime: "20:00", venue: "BC Place", city: "Vancouver", teamA: "SUI", teamB: "DZA", labelA: "", labelB: "", scoreA: 2, scoreB: 0 },
  { id: "R32-14", round: "R32", date: "2026-07-03", kickoffTime: "11:00", venue: "AT&T Stadium", city: "Arlington", teamA: "AUS", teamB: "EGY", labelA: "", labelB: "", scoreA: 1, scoreB: 1, aet: true, penA: 2, penB: 4 },
  { id: "R32-15", round: "R32", date: "2026-07-03", kickoffTime: "15:00", venue: "Hard Rock Stadium", city: "Miami Gardens", teamA: "ARG", teamB: "CPV", labelA: "", labelB: "", scoreA: 3, scoreB: 2, aet: true },
  { id: "R32-16", round: "R32", date: "2026-07-03", kickoffTime: "18:30", venue: "Arrowhead Stadium", city: "Kansas City", teamA: "COL", teamB: "GHA", labelA: "", labelB: "", scoreA: 1, scoreB: 0 },
  { id: "R16-1", round: "R16", date: "2026-07-04", kickoffTime: "10:00", venue: "NRG Stadium", city: "Houston", teamA: "CAN", teamB: "MAR", labelA: "", labelB: "", scoreA: 0, scoreB: 3 },
  { id: "R16-2", round: "R16", date: "2026-07-04", kickoffTime: "14:00", venue: "Lincoln Financial Field", city: "Philadelphia", teamA: "PAR", teamB: "FRA", labelA: "", labelB: "", scoreA: 0, scoreB: 1 },
  { id: "R16-3", round: "R16", date: "2026-07-05", kickoffTime: "13:00", venue: "MetLife Stadium", city: "East Rutherford", teamA: "BRA", teamB: "NOR", labelA: "", labelB: "", scoreA: 1, scoreB: 2 },
  { id: "R16-4", round: "R16", date: "2026-07-05", kickoffTime: "18:00", venue: "Estadio Azteca", city: "Mexico City", teamA: "MEX", teamB: "ENG", labelA: "", labelB: "", scoreA: 2, scoreB: 3 },
  { id: "R16-5", round: "R16", date: "2026-07-06", kickoffTime: "12:00", venue: "AT&T Stadium", city: "Arlington", teamA: "POR", teamB: "ESP", labelA: "", labelB: "", scoreA: 0, scoreB: 1 },
  { id: "R16-6", round: "R16", date: "2026-07-06", kickoffTime: "17:00", venue: "Lumen Field", city: "Seattle", teamA: "USA", teamB: "BEL", labelA: "", labelB: "", scoreA: 1, scoreB: 4 },
  { id: "R16-7", round: "R16", date: "2026-07-07", kickoffTime: "09:00", venue: "Mercedes-Benz Stadium", city: "Atlanta", teamA: "ARG", teamB: "EGY", labelA: "", labelB: "", scoreA: 3, scoreB: 2 },
  { id: "R16-8", round: "R16", date: "2026-07-07", kickoffTime: "13:00", venue: "BC Place", city: "Vancouver", teamA: "SUI", teamB: "COL", labelA: "", labelB: "", scoreA: 0, scoreB: 0, aet: true, penA: 4, penB: 3 },
  { id: "QF-1", round: "QF", date: "2026-07-09", kickoffTime: "13:00", venue: "Gillette Stadium", city: "Foxborough", teamA: "FRA", teamB: "MAR", labelA: "", labelB: "", scoreA: 2, scoreB: 0 },
  { id: "QF-2", round: "QF", date: "2026-07-10", kickoffTime: "12:00", venue: "SoFi Stadium", city: "Inglewood", teamA: "ESP", teamB: "BEL", labelA: "", labelB: "", scoreA: 2, scoreB: 1 },
  { id: "QF-3", round: "QF", date: "2026-07-11", kickoffTime: "14:00", venue: "Hard Rock Stadium", city: "Miami Gardens", teamA: "NOR", teamB: "ENG", labelA: "", labelB: "", scoreA: 1, scoreB: 2, aet: true },
  { id: "QF-4", round: "QF", date: "2026-07-11", kickoffTime: "18:00", venue: "Arrowhead Stadium", city: "Kansas City", teamA: "ARG", teamB: "SUI", labelA: "", labelB: "", scoreA: 3, scoreB: 1, aet: true },
  { id: "SF-1", round: "SF", date: "2026-07-14", kickoffTime: "12:00", venue: "AT&T Stadium", city: "Arlington", teamA: "FRA", teamB: "ESP", labelA: "", labelB: "", scoreA: 0, scoreB: 2 },
  { id: "SF-2", round: "SF", date: "2026-07-15", kickoffTime: "12:00", venue: "Mercedes-Benz Stadium", city: "Atlanta", teamA: "ENG", teamB: "ARG", labelA: "", labelB: "", scoreA: 1, scoreB: 2 },
  { id: "3P-1", round: "3P", date: "2026-07-18", kickoffTime: "14:00", venue: "Hard Rock Stadium", city: "Miami Gardens", teamA: "FRA", teamB: "ENG", labelA: "", labelB: "", scoreA: 4, scoreB: 6 },
  { id: "Final-1", round: "Final", date: "2026-07-19", kickoffTime: "12:00", venue: "MetLife Stadium", city: "East Rutherford", teamA: "ESP", teamB: "ARG", labelA: "", labelB: "", scoreA: 1, scoreB: 0, aet: true },
];
