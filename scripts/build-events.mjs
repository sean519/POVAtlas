// Generate src/data/events.ts — sports events and the countries/regions that
// take part, so each team becomes a way into its country's profile.
//
//   node scripts/build-events.mjs
//
// Every list (pools, qualified teams, standings, medal tables) is parsed from
// the event's Wikipedia page — nothing hand-typed. Event metadata (dates, host)
// lives in EVENTS below; the script prints each page's infobox dates so they
// can be checked. Unknown team codes abort the run instead of being guessed.
// Re-run when an upcoming event's teams change (qualification, draws, results).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const OUT = `${root}src/data/events.ts`;
const WORLD = `${root}src/data/worldCountries.ts`;
const API = "https://en.wikipedia.org/w/api.php";
const UA = "POVAtlasDataBuild/1.0 (https://povatlas.com)";

/**
 * kind: "groups" (named team lists: pools / confederations), "ranking" (final
 * standings), "medals" (medal table). `page` is parsed; `infobox` is the main
 * article whose dates are printed for checking.
 */
const EVENTS = [
  {
    id: "wwc-2027", kind: "groups", parser: "qualified",
    name: "FIFA Women's World Cup 2027", nameZh: "2027年女足世界杯",
    sport: "Football", sportZh: "足球", icon: "⚽",
    start: "2027-06-24", end: "2027-07-25", city: "Brazil", cityZh: "巴西", hostCode: "BRA",
    page: "2027 FIFA Women's World Cup", infobox: "2027 FIFA Women's World Cup",
    groupLabel: "Confederation", totalTeams: 32,
    note: "Qualification is still under way — more teams join as they qualify. The group draw is on 11 December 2026.",
  },
  {
    id: "rwc-2027", kind: "groups", parser: "rugbyPools",
    name: "Rugby World Cup 2027", nameZh: "2027年橄榄球世界杯",
    sport: "Rugby union", sportZh: "英式橄榄球", icon: "🏉",
    start: "2027-10-01", end: "2027-11-13", city: "Australia", cityZh: "澳大利亚", hostCode: "AUS",
    page: "2027 Rugby World Cup", infobox: "2027 Rugby World Cup",
    groupLabel: "Pool", totalTeams: 24,
  },
  {
    id: "asian-games-2026", kind: "medals", parser: "medals",
    name: "Asian Games 2026", nameZh: "2026年亚运会",
    sport: "Multi-sport", sportZh: "综合运动会", icon: "🏅",
    start: "2026-09-19", end: "2026-10-04", city: "Aichi–Nagoya, Japan", cityZh: "日本爱知·名古屋", hostCode: "JPN",
    page: "2026 Asian Games medal table", infobox: "2026 Asian Games",
  },
  {
    id: "fiba-wwc-2026", kind: "ranking", parser: "fibaStandings",
    name: "FIBA Women's Basketball World Cup 2026", nameZh: "2026年女篮世界杯",
    sport: "Basketball", sportZh: "篮球", icon: "🏀",
    start: "2026-09-04", end: "2026-09-13", city: "Berlin, Germany", cityZh: "德国柏林", hostCode: "DEU",
    page: "2026 FIBA Women's Basketball World Cup", infobox: "2026 FIBA Women's Basketball World Cup",
  },
  {
    id: "commonwealth-2026", kind: "medals", parser: "medals",
    name: "Commonwealth Games 2026", nameZh: "2026年英联邦运动会",
    sport: "Multi-sport", sportZh: "综合运动会", icon: "🏅",
    start: "2026-07-23", end: "2026-08-02", city: "Glasgow, Scotland", cityZh: "英国苏格兰格拉斯哥", hostCode: "GBR",
    page: "2026 Commonwealth Games medal table", infobox: "2026 Commonwealth Games",
  },
  {
    id: "winter-olympics-2026", kind: "medals", parser: "medals",
    name: "Winter Olympics 2026", nameZh: "2026年冬奥会",
    sport: "Winter sports", sportZh: "冬季运动", icon: "⛷️",
    start: "2026-02-06", end: "2026-02-22", city: "Milan & Cortina d'Ampezzo, Italy", cityZh: "意大利米兰·科尔蒂纳丹佩佐", hostCode: "ITA",
    page: "2026 Winter Olympics medal table", infobox: "2026 Winter Olympics",
  },
];

// Sport-body codes (IOC / FIFA / World Rugby / FIBA / CGF) → Atlas country code,
// where they differ from ISO alpha-3. Teams that aren't a whole country carry a
// name and a note; `atlas: null` means no country (e.g. neutral athletes).
const CODE_MAP = {
  ALG: "DZA", ANG: "AGO", ANT: "ATG", ARU: "ABW", BAH: "BHS", BAN: "BGD", BAR: "BRB",
  BER: "BMU", BHU: "BTN", BIZ: "BLZ", BOT: "BWA", BRU: "BRN", BUL: "BGR", BUR: "BFA",
  CAM: "KHM", CAY: "CYM", CGO: "COG", CHA: "TCD", CHI: "CHL", CRC: "CRI", CRO: "HRV",
  DEN: "DNK", ESA: "SLV", FIJ: "FJI", GAM: "GMB", GBS: "GNB", GEQ: "GNQ", GER: "DEU",
  GRE: "GRC", GRN: "GRD", GUA: "GTM", GUI: "GIN", HAI: "HTI", HON: "HND", INA: "IDN",
  IRI: "IRN", ISV: "VIR", IVB: "VGB", KSA: "SAU", KUW: "KWT", LAT: "LVA", LBA: "LBY",
  LES: "LSO", LIB: "LBN", MAD: "MDG", MAS: "MYS", MAW: "MWI", MGL: "MNG", MON: "MCO",
  MRI: "MUS", MTN: "MRT", MYA: "MMR", NCA: "NIC", NED: "NLD", NEP: "NPL", NGR: "NGA",
  NIG: "NER", OMA: "OMN", PAR: "PRY", PHI: "PHL", PLE: "PSE", POR: "PRT", PUR: "PRI",
  RSA: "ZAF", SAM: "WSM", SEY: "SYC", SKN: "KNA", SLO: "SVN", SOL: "SLB", SRI: "LKA",
  SUD: "SDN", SUI: "CHE", TAN: "TZA", TGA: "TON", TOG: "TGO", TPE: "TWN", TRI: "TTO",
  UAE: "ARE", URU: "URY", VAN: "VUT", VIN: "VCT", VIE: "VNM", ZAM: "ZMB", ZIM: "ZWE",
  ROM: "ROU", IRE: "IRL", NFI: "NFK", KOS: "UNK",
};

/** Teams whose name differs from the Atlas country (or that have no country). */
const SPECIAL = {
  ENG: { atlas: "GBR", name: "England", nameZh: "英格兰", note: "England competes as its own team; it is part of the United Kingdom." },
  SCO: { atlas: "GBR", name: "Scotland", nameZh: "苏格兰", note: "Scotland competes as its own team; it is part of the United Kingdom." },
  WAL: { atlas: "GBR", name: "Wales", nameZh: "威尔士", note: "Wales competes as its own team; it is part of the United Kingdom." },
  NIR: { atlas: "GBR", name: "Northern Ireland", nameZh: "北爱尔兰", note: "Northern Ireland competes as its own team; it is part of the United Kingdom." },
  TPE: { atlas: "TWN", name: "Chinese Taipei", nameZh: "中华台北" },
  HKG: { atlas: "HKG", name: "Hong Kong, China", nameZh: "中国香港" },
  MAC: { atlas: "MAC", name: "Macau, China", nameZh: "中国澳门" },
  JEY: { atlas: "JEY", name: "Jersey", nameZh: "泽西" },
  GUE: { atlas: "GGY", name: "Guernsey", nameZh: "根西" },
  IOM: { atlas: "IMN", name: "Isle of Man", nameZh: "马恩岛" },
  AIN: { atlas: null, name: "Individual Neutral Athletes", nameZh: "中立个人运动员", note: "Athletes competing without a national team; not in the official IOC medal table." },
  EOR: { atlas: null, name: "Refugee Team", nameZh: "难民代表团" },
};
const RUGBY_SPECIAL = {
  IRE: { atlas: "IRL", name: "Ireland", nameZh: "爱尔兰", note: "The Ireland rugby team represents the whole island — both Ireland and Northern Ireland (UK)." },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wikitext(page) {
  const url = `${API}?action=parse&prop=wikitext&format=json&formatversion=2&redirects=1&page=${encodeURIComponent(page)}`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    const j = res.ok ? await res.json() : null;
    if (j?.parse?.wikitext) return j.parse.wikitext;
    if (attempt >= 3) throw new Error(`no wikitext for ${page}`);
    await sleep(1500 * attempt);
  }
}

const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "");

function templateAt(wt, i) {
  let depth = 0;
  for (let k = i; k < wt.length; k++) {
    if (wt[k] === "{" && wt[k + 1] === "{") { depth++; k++; }
    else if (wt[k] === "}" && wt[k + 1] === "}") { depth--; k++; if (depth === 0) return wt.slice(i, k + 1); }
  }
  return wt.slice(i);
}

function section(wt, heading) {
  const m = wt.match(new RegExp(`^(=+)\\s*${heading}\\s*\\1\\s*$`, "m"));
  if (!m) throw new Error(`section "${heading}" not found`);
  const start = m.index + m[0].length;
  const level = m[1].length;
  const rest = wt.slice(start);
  const next = rest.search(new RegExp(`^={2,${level}}[^=]`, "m"));
  return next === -1 ? rest : rest.slice(0, next);
}

/* ---------------- Parsers: return { groups?, ranking?, medals? } of raw codes */

const PARSERS = {
  // "Qualified teams": '''[[…|AFC]]''' (6) then * {{#invoke:flag|fbw|AUS}} …
  qualified(wt) {
    const body = stripComments(section(wt, "Qualified teams"));
    const groups = [];
    for (const block of body.split(/\{\{no col break\|/).slice(1)) {
      const label = block.match(/'''\[\[[^\]|]*\|([^\]]+)\]\]'''/)?.[1];
      const codes = [...block.matchAll(/\{\{#invoke:flag\|fbw\|([A-Z]{3})\}\}/g)].map((m) => m[1]);
      if (label && codes.length) groups.push({ name: label, codes });
    }
    return { groups };
  },
  // Pool-stage table: header "Pool A…F", then one cell per pool of {{ru|XXX}}.
  rugbyPools(wt) {
    const body = stripComments(section(wt, "Pool stage"));
    const table = body.slice(body.indexOf("{|"), body.indexOf("\n|}") + 3);
    const names = [...table.matchAll(/\|(Pool [A-Z])\]\]/g)].map((m) => m[1]);
    const cells = table
      .split(/\n\|(?![-}])/)
      .slice(1)
      .map((c) => [...c.matchAll(/\{\{[Rr]u\|([A-Z]{3})/g)].map((m) => m[1]))
      .filter((c) => c.length);
    if (names.length !== cells.length) throw new Error(`pools: ${names.length} names vs ${cells.length} cells`);
    return { groups: names.map((n, i) => ({ name: n, codes: cells[i] })) };
  },
  // Final standings rows: | {{gold1}} || align=left|{{bkw|USA}} …  /  | 4th || …
  fibaStandings(wt) {
    const body = section(wt, "Final standings");
    const medal = { gold1: 1, silver2: 2, bronze3: 3 };
    const ranking = [];
    for (const m of body.matchAll(/^\|\s*(?:\{\{(gold1|silver2|bronze3)\}\}|(\d+)(?:st|nd|rd|th))\s*\|\|[^\n]*?\{\{bkw\|([A-Z]{3})\}\}/gm)) {
      ranking.push({ rank: m[1] ? medal[m[1]] : Number(m[2]), code: m[3] });
    }
    return { ranking };
  },
  // {{Medals table …| gold_XXX = n | silver_XXX = n | bronze_XXX = n …}}
  medals(wt) {
    const i = wt.search(/\{\{(#invoke:Medals table\|createTable|Medals table)/);
    if (i < 0) throw new Error("medals table template not found");
    const tpl = stripComments(templateAt(wt, i));
    const counts = {};
    for (const m of tpl.matchAll(/\|\s*(gold|silver|bronze)_([A-Z]{3})\s*=\s*(\d+)/g)) {
      (counts[m[2]] ??= { gold: 0, silver: 0, bronze: 0 })[m[1]] = Number(m[3]);
    }
    return { medals: Object.entries(counts).map(([code, c]) => ({ code, ...c })) };
  },
};

/* ---------------- Assemble ---------------- */

const world = JSON.parse(readFileSync(WORLD, "utf8").match(/WORLD_COUNTRIES: WorldCountry\[\] = (\[.*?\]);\n/s)[1]);
const byCode = new Map(world.map((c) => [c.code, c]));

function team(code, eventId) {
  const special = (eventId.startsWith("rwc") && RUGBY_SPECIAL[code]) || SPECIAL[code];
  if (special) return { code, ...special };
  const atlas = CODE_MAP[code] ?? code;
  const c = byCode.get(atlas);
  if (!c) throw new Error(`${eventId}: unknown team code ${code} (add it to CODE_MAP/SPECIAL)`);
  return { code, atlas, name: c.name, nameZh: c.nameZh };
}

const out = [];
for (const ev of EVENTS) {
  const raw = PARSERS[ev.parser](await wikitext(ev.page));
  await sleep(800);
  const info = await wikitext(ev.infobox);
  const infDates = [...info.matchAll(/^\s*\|\s*(dates|start_date|end_date|opening|closing)\s*=\s*([^\n|]+)/gim)]
    .slice(0, 2)
    .map((m) => `${m[1]}=${m[2].trim()}`)
    .join(", ");
  await sleep(800);

  const { parser, page, infobox, ...meta } = ev;
  const event = { ...meta, source: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.replace(/ /g, "_"))}` };

  if (raw.groups) {
    event.groups = raw.groups.map((g) => ({ name: g.name, teams: g.codes.map((c) => team(c, ev.id)) }));
    const n = event.groups.reduce((s, g) => s + g.teams.length, 0);
    if (!n) throw new Error(`${ev.id}: no teams parsed`);
  }
  if (raw.ranking) {
    if (raw.ranking.length < 8) throw new Error(`${ev.id}: only ${raw.ranking.length} standings rows`);
    event.ranking = raw.ranking.map((r) => ({ rank: r.rank, team: team(r.code, ev.id) }));
  }
  if (raw.medals) {
    if (raw.medals.length < 10) throw new Error(`${ev.id}: only ${raw.medals.length} medal rows`);
    // IOC ordering: gold, then silver, then bronze; ties share a rank. Teams
    // outside the official table (neutral athletes) are listed last, unranked.
    const all = raw.medals
      .map((m) => ({ team: team(m.code, ev.id), gold: m.gold, silver: m.silver, bronze: m.bronze, total: m.gold + m.silver + m.bronze }))
      .sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || a.team.code.localeCompare(b.team.code));
    const ranked = all.filter((r) => r.team.atlas !== null);
    let rank = 0;
    ranked.forEach((r, i) => {
      const prev = ranked[i - 1];
      if (!prev || prev.gold !== r.gold || prev.silver !== r.silver || prev.bronze !== r.bronze) rank = i + 1;
      r.rank = rank;
    });
    event.medals = [...ranked, ...all.filter((r) => r.team.atlas === null).map((r) => ({ ...r, rank: null }))];
  }
  out.push(event);

  const summary = event.groups
    ? event.groups.map((g) => `${g.name}: ${g.teams.map((t) => t.code).join(" ")}`).join(" | ")
    : event.ranking
    ? event.ranking.map((r) => `${r.rank}.${r.team.code}`).join(" ")
    : `${event.medals.length} medalling teams; top: ${event.medals.slice(0, 3).map((m) => `${m.team.code} ${m.gold}/${m.silver}/${m.bronze}`).join(", ")}`;
  console.log(`\n${ev.icon} ${ev.id}  [config ${ev.start}→${ev.end}]  infobox dates: ${infDates ?? "?"}\n   ${summary}`);
}

const file = `// GENERATED by scripts/build-events.mjs — do not edit by hand.
// Source: Wikipedia (each event's page, see \`source\`), CC BY-SA 4.0.
// Generated ${new Date().toISOString().slice(0, 10)}.
import type { SportEvent } from "../types";

export const SPORT_EVENTS: SportEvent[] = ${JSON.stringify(out)};
`;
writeFileSync(OUT, file);
console.log(`\nwrote ${out.length} events (${(file.length / 1024).toFixed(0)} KB) → src/data/events.ts`);
