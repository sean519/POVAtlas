/**
 * Real coordinates for the 16 host stadiums of the 2026 World Cup, keyed by
 * stadium name — the same names used in `matches.ts` VENUES and returned by
 * the Wikipedia-backed `/api/knockout` feed. Used to place the ⚽ marker at
 * the actual match venue on the map.
 */
export interface VenuePoint {
  lat: number;
  lng: number;
}

const VENUE_POINTS: Record<string, VenuePoint> = {
  "Estadio Azteca": { lat: 19.3029, lng: -99.1505 },
  "Estadio Akron": { lat: 20.6817, lng: -103.4626 },
  "Estadio BBVA": { lat: 25.6693, lng: -100.2442 },
  "BMO Field": { lat: 43.6332, lng: -79.4186 },
  "BC Place": { lat: 49.2768, lng: -123.1119 },
  "MetLife Stadium": { lat: 40.8135, lng: -74.0745 },
  "Gillette Stadium": { lat: 42.0909, lng: -71.2643 },
  "Lincoln Financial Field": { lat: 39.9008, lng: -75.1675 },
  "Hard Rock Stadium": { lat: 25.958, lng: -80.2389 },
  "Mercedes-Benz Stadium": { lat: 33.7554, lng: -84.401 },
  "NRG Stadium": { lat: 29.6847, lng: -95.4107 },
  "AT&T Stadium": { lat: 32.7473, lng: -97.0945 },
  "Arrowhead Stadium": { lat: 39.0489, lng: -94.4839 },
  "Levi's Stadium": { lat: 37.4033, lng: -121.9694 },
  "SoFi Stadium": { lat: 33.9535, lng: -118.3392 },
  "Lumen Field": { lat: 47.5952, lng: -122.3316 },
};

/**
 * Look up a stadium's coordinates by name. Exact match first, then a
 * case-insensitive containment match either way, so slight naming variants
 * from the live feed (e.g. "Estadio Azteca (Mexico City)") still resolve.
 */
export function getVenuePoint(venueName: string | null | undefined): VenuePoint | null {
  if (!venueName) return null;
  const exact = VENUE_POINTS[venueName];
  if (exact) return exact;
  const needle = venueName.toLowerCase();
  for (const [name, pt] of Object.entries(VENUE_POINTS)) {
    const key = name.toLowerCase();
    if (needle.includes(key) || key.includes(needle)) return pt;
  }
  return null;
}
