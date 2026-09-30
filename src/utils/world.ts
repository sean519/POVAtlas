import { useEffect, useState } from "react";
import type { Team, WorldCountry } from "../types";
import { formatArea, formatGDP, formatPerCapita } from "./formatters";

/**
 * Atlas data: facts + World Bank statistics for every country. The dataset
 * (~30 KB gzip) is loaded on demand — import `useWorldData` / `loadWorld`, never
 * `data/worldCountries` directly from eagerly loaded code.
 */
export interface WorldData {
  countries: WorldCountry[];
  byCode: Map<string, WorldCountry>;
  /** Daily-puzzle answer pool (codes). */
  puzzlePool: string[];
}

let worldPromise: Promise<WorldData> | null = null;

export function loadWorld(): Promise<WorldData> {
  worldPromise ??= import("../data/worldCountries").then((m) => ({
    countries: m.WORLD_COUNTRIES,
    byCode: new Map(m.WORLD_COUNTRIES.map((c) => [c.code, c])),
    puzzlePool: m.PUZZLE_POOL,
  }));
  worldPromise.catch(() => (worldPromise = null));
  return worldPromise;
}

/** The Atlas dataset once loaded, else null (triggers the load). */
export function useWorldData(): WorldData | null {
  const [data, setData] = useState<WorldData | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadWorld()
      .then((d) => !cancelled && setData(d))
      .catch(() => {
        // offline / chunk failed — Atlas views show their loading state
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}

/** The Atlas country for a World Cup team (England/Scotland → United Kingdom). */
export function atlasCodeForTeam(team: Team): string {
  return team.isoA3Code.startsWith("GB-") ? "GBR" : team.isoA3Code;
}

export function flagSrc(iso2: string): string {
  return `https://flagcdn.com/${iso2}.svg`;
}

/* ---------------- Statistics ---------------- */

export type MetricKey =
  | "population"
  | "area"
  | "density"
  | "gdp"
  | "gdpPerCapita"
  | "lifeExpectancy"
  | "internet"
  | "urban"
  | "forest";

export interface MetricValue {
  value: number;
  /** Data year, or null for fixed facts (area). */
  year: number | null;
}

export interface MetricDef {
  key: MetricKey;
  label: string;
  labelZh: string;
  icon: string;
  get: (c: WorldCountry) => MetricValue | null;
  format: (v: number) => string;
}

const yv = (s: [number, number] | null): MetricValue | null =>
  s ? { value: s[0], year: s[1] } : null;

/** Compact number: 1.41B, 123M, 56.9K, 9,492. */
export function formatCompact(v: number): string {
  const abs = Math.abs(v);
  const sig = (n: number) => (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2));
  if (abs >= 1e9) return `${sig(v / 1e9)}B`;
  if (abs >= 1e6) return `${sig(v / 1e6)}M`;
  if (abs >= 1e5) return `${(v / 1e3).toFixed(0)}K`;
  return Math.round(v).toLocaleString("en-US");
}

const pct = (v: number) => `${v.toFixed(v >= 10 ? 0 : 1)}%`;

export const METRICS: MetricDef[] = [
  {
    key: "population",
    label: "Population",
    labelZh: "人口",
    icon: "👥",
    get: (c) => yv(c.population),
    format: formatCompact,
  },
  {
    key: "area",
    label: "Area",
    labelZh: "面积",
    icon: "📐",
    get: (c) => (c.area ? { value: c.area, year: null } : null),
    format: formatArea,
  },
  {
    key: "density",
    label: "People per km²",
    labelZh: "人口密度",
    icon: "🏘️",
    get: (c) =>
      c.population && c.area ? { value: c.population[0] / c.area, year: c.population[1] } : null,
    format: (v) => (v >= 100 ? Math.round(v).toLocaleString("en-US") : v.toFixed(1)),
  },
  {
    key: "gdp",
    label: "GDP (total)",
    labelZh: "国内生产总值",
    icon: "💰",
    get: (c) => yv(c.gdp),
    format: formatGDP,
  },
  {
    key: "gdpPerCapita",
    label: "GDP per person",
    labelZh: "人均GDP",
    icon: "💵",
    get: (c) => yv(c.gdpPerCapita),
    format: formatPerCapita,
  },
  {
    key: "lifeExpectancy",
    label: "Life expectancy",
    labelZh: "预期寿命",
    icon: "❤️",
    get: (c) => yv(c.lifeExpectancy),
    format: (v) => `${v.toFixed(1)} yrs`,
  },
  {
    key: "internet",
    label: "Internet users",
    labelZh: "互联网普及率",
    icon: "📶",
    get: (c) => yv(c.internet),
    format: pct,
  },
  {
    key: "urban",
    label: "Living in cities",
    labelZh: "城市人口比例",
    icon: "🏙️",
    get: (c) => yv(c.urban),
    format: pct,
  },
  {
    key: "forest",
    label: "Forest cover",
    labelZh: "森林覆盖率",
    icon: "🌳",
    get: (c) => yv(c.forest),
    format: pct,
  },
];

export const METRIC_BY_KEY = new Map(METRICS.map((m) => [m.key, m]));

/* ---------------- Search ---------------- */

/**
 * Countries matching a query by English/Chinese/official name or code, best
 * matches first (exact/prefix before substring).
 */
export function searchCountries(countries: WorldCountry[], query: string, limit = 8): WorldCountry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { c: WorldCountry; s: number }[] = [];
  for (const c of countries) {
    const name = c.name.toLowerCase();
    const fields = [name, c.nameZh, c.official.toLowerCase(), c.code.toLowerCase(), c.iso2];
    let s = -1;
    if (fields.some((f) => f === q)) s = 0;
    else if (name.startsWith(q) || c.nameZh.startsWith(q)) s = 1;
    else if (name.split(/[\s-]/).some((w) => w.startsWith(q))) s = 2;
    else if (fields.some((f) => f.includes(q))) s = 3;
    if (s >= 0) scored.push({ c, s });
  }
  return scored
    .sort((a, b) => a.s - b.s || (b.c.population?.[0] ?? 0) - (a.c.population?.[0] ?? 0))
    .slice(0, limit)
    .map((x) => x.c);
}

/** Great-circle distance in km between two lat/lng points. */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing (0 = north, clockwise) from point a to point b. */
export function bearingDeg(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(bLng - aLng)) * Math.cos(toRad(bLat));
  const x =
    Math.cos(toRad(aLat)) * Math.sin(toRad(bLat)) -
    Math.sin(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.cos(toRad(bLng - aLng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
