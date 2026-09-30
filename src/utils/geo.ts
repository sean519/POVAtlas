import geoUrl from "../assets/countries.geo.json?url";

export type GeoData = GeoJSON.FeatureCollection;

// Compact world GeoJSON keyed by ISO A3 in feature.id (from johan/world.geo.json,
// coordinates rounded to 3 dp; Kosovo re-keyed to "UNK"). Self-hosted with a
// content-hashed filename, so the CDN serves it compressed and browsers cache
// it permanently. Shared by the map and the daily puzzle's silhouettes.
let geoPromise: Promise<GeoData> | null = null;

export function loadGeo(): Promise<GeoData> {
  geoPromise ??= fetch(geoUrl).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<GeoData>;
  });
  // A failed attempt shouldn't be cached — allow a retry on next call.
  geoPromise.catch(() => (geoPromise = null));
  return geoPromise;
}

/** The feature for a country code, or undefined if it isn't on the map. */
export function findFeature(geo: GeoData, code: string): GeoJSON.Feature | undefined {
  return geo.features.find((f) => String(f.id) === code);
}
