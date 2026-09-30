// Generate src/data/worldCountries.ts — facts + statistics for every country.
//
//   node scripts/build-world-data.mjs
//
// Sources (fetched fresh, nothing hand-typed):
//  - mledoze/countries (ODbL): names, capital, region, languages, currencies,
//    borders, area, coordinates, Chinese names.
//  - World Bank Open Data API: population, GDP, GDP per capita, life
//    expectancy, internet use, urban share, forest cover. Each value is the
//    most recent non-empty year for that country, stored with its year.
// Re-run about once a year when the World Bank publishes new figures.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const OUT = `${root}src/data/worldCountries.ts`;
const GEO = `${root}src/assets/countries.geo.json`;
const TEAMS = `${root}src/data/teams.ts`;

const COUNTRIES_URL = "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";
const WB = "https://api.worldbank.org/v2/country/all/indicator";
const INDICATORS = {
  population: "SP.POP.TOTL",
  gdp: "NY.GDP.MKTP.CD",
  gdpPerCapita: "NY.GDP.PCAP.CD",
  lifeExpectancy: "SP.DYN.LE00.IN",
  internet: "IT.NET.USER.ZS",
  urban: "SP.URB.TOTL.IN.ZS",
  forest: "AG.LND.FRST.ZS",
};
// World Bank code → mledoze cca3 where they differ.
const WB_ALIAS = { XKX: "UNK" };

// Chinese-name fixes: Traditional → Simplified, and a few non-standard names.
const ZH_FIX = {
  BES: "荷兰加勒比区",
  MKD: "北马其顿",
  TWN: "台湾",
  DMA: "多米尼克",
  DOM: "多米尼加共和国",
  COG: "刚果（布）",
  COD: "刚果（金）",
  ATF: "法属南部和南极领地",
};

// Daily-puzzle answers must be recognizable shapes on the map.
const PUZZLE_MIN_POP = 1_000_000;
const PUZZLE_MIN_AREA = 10_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": "POVAtlasDataBuild/1.0 (https://povatlas.com)" } });
    if (res.ok) return res.json();
    if (attempt >= 3) throw new Error(`${res.status} ${url}`);
    await sleep(1500 * attempt);
  }
}

const round = (v, dp) => (v == null ? null : Math.round(v * 10 ** dp) / 10 ** dp);

// ---- 1. Country facts ----
const raw = await getJson(COUNTRIES_URL);

// Team Chinese names already used on the site win, so both sections agree.
// (teams.ts lists nameZh, fifaCode, isoA3Code consecutively in each entry.)
const teamZh = new Map(
  [...readFileSync(TEAMS, "utf8").matchAll(/nameZh:\s*"([^"]+)",\s*fifaCode:\s*"[^"]+",\s*isoA3Code:\s*"([A-Z]{3})"/g)]
    .map((m) => [m[2], m[1]])
);
if (teamZh.size < 40) throw new Error(`parsed only ${teamZh.size} team names from teams.ts`);

// ---- 2. World Bank statistics ----
const stats = {};
for (const [key, code] of Object.entries(INDICATORS)) {
  const [meta, rows] = await getJson(`${WB}/${code}?format=json&per_page=500&mrnev=1`);
  if (!Array.isArray(rows)) throw new Error(`no rows for ${code}`);
  if (meta.pages > 1) throw new Error(`${code}: more than one page`);
  for (const r of rows) {
    if (r.value == null || !r.countryiso3code) continue;
    const cca3 = WB_ALIAS[r.countryiso3code] ?? r.countryiso3code;
    (stats[cca3] ??= {})[key] = [r.value, Number(r.date)];
  }
  await sleep(400);
}
const DP = { population: 0, gdp: -6, gdpPerCapita: 0, lifeExpectancy: 1, internet: 1, urban: 1, forest: 1 };
const stat = (cca3, key) => {
  const s = stats[cca3]?.[key];
  if (!s) return null;
  const v = DP[key] < 0 ? Math.round(s[0] / 10 ** -DP[key]) * 10 ** -DP[key] : round(s[0], DP[key]);
  return [v, s[1]];
};

// ---- 3. Assemble ----
const countries = raw
  .map((c) => {
    const s = (k) => stat(c.cca3, k);
    return {
      code: c.cca3,
      iso2: c.cca2.toLowerCase(),
      name: c.name.common,
      official: c.name.official,
      nameZh: teamZh.get(c.cca3) ?? ZH_FIX[c.cca3] ?? c.translations?.zho?.common ?? c.name.common,
      capital: (c.capital ?? []).join(", "),
      region: c.region,
      subregion: c.subregion ?? "",
      lat: round(c.latlng?.[0] ?? 0, 2),
      lng: round(c.latlng?.[1] ?? 0, 2),
      area: c.area > 0 ? c.area : null,
      landlocked: Boolean(c.landlocked),
      borders: c.borders ?? [],
      languages: Object.values(c.languages ?? {}),
      currencies: Object.entries(c.currencies ?? {}).map(([k, v]) => `${v.name} (${k})`),
      population: s("population"),
      gdp: s("gdp"),
      gdpPerCapita: s("gdpPerCapita"),
      lifeExpectancy: s("lifeExpectancy"),
      internet: s("internet"),
      urban: s("urban"),
      forest: s("forest"),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

// ---- 4. Daily-puzzle pool: on the map, big enough to recognize ----
const geoIds = new Set(JSON.parse(readFileSync(GEO, "utf8")).features.map((f) => String(f.id)));
const pool = countries
  .filter((c) => geoIds.has(c.code) && (c.population?.[0] ?? 0) >= PUZZLE_MIN_POP && (c.area ?? 0) >= PUZZLE_MIN_AREA)
  .map((c) => c.code)
  .sort();

// ---- 5. Sanity checks (fail loudly rather than ship bad data) ----
const by = new Map(countries.map((c) => [c.code, c]));
const expect = (ok, msg) => { if (!ok) throw new Error(`sanity check failed: ${msg}`); };
expect(countries.length >= 240, `only ${countries.length} countries`);
expect(by.get("CHN").population[0] > 1.3e9, "China population");
expect(by.get("USA").gdp[0] > 2e13, "USA GDP");
expect(by.get("JPN").lifeExpectancy[0] > 80, "Japan life expectancy");
expect(by.get("UNK")?.population, "Kosovo mapped from XKX");
expect(pool.length > 120, `puzzle pool only ${pool.length}`);

// ---- 6. Write ----
const years = Object.fromEntries(
  Object.keys(INDICATORS).map((k) => {
    const ys = countries.map((c) => c[k]?.[1]).filter(Boolean);
    return [k, Math.max(...ys)];
  })
);
const out = `// GENERATED by scripts/build-world-data.mjs — do not edit by hand.
// Sources: mledoze/countries (ODbL) · World Bank Open Data (CC BY 4.0).
// Generated ${new Date().toISOString().slice(0, 10)}; latest data years: ${JSON.stringify(years)}.
import type { WorldCountry } from "../types";

export const WORLD_COUNTRIES: WorldCountry[] = ${JSON.stringify(countries)};

/** Daily-puzzle answer pool (on the map, population ≥ 1M, area ≥ 10,000 km²). */
export const PUZZLE_POOL: string[] = ${JSON.stringify(pool)};
`;
writeFileSync(OUT, out);
const missing = (k) => countries.filter((c) => !c[k]).length;
console.log(`wrote ${countries.length} countries (${(out.length / 1024).toFixed(0)} KB); puzzle pool ${pool.length}`);
console.log(`missing: population ${missing("population")}, gdp ${missing("gdp")}, lifeExpectancy ${missing("lifeExpectancy")}`);
console.log(`team zh names reused: ${teamZh.size}; latest years ${JSON.stringify(years)}`);
