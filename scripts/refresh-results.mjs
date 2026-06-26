// Refresh real WC2026 results + Golden Boot from Wikipedia, in place.
//
// Updates ONLY the score columns of src/data/matches.ts and regenerates
// src/data/topScorers.ts. Squads/fixtures/venues/dates are never touched.
//
// Safety: if any required fetch fails or the data looks implausibly small,
// the script throws and writes nothing — so a transient failure can never
// wipe good scores. Run by .github/workflows/refresh-results.yml every 30 min.
//
// Usage: node scripts/refresh-results.mjs   (run from the repo root)

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const API = "https://en.wikipedia.org/w/api.php";
const UA = "POVAtlasResultsBot/1.0 (https://povatlas.com; +results refresh)";
const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const RESULT_ALIAS = { ALG: "DZA", HAI: "HTI", IRN: "IRI" }; // wiki -> app fifaCode
const SCORERS_PAGE = "Module:Goalscorers/data/2026 FIFA World Cup";

const ROOT = process.cwd();
const MATCHES = resolve(ROOT, "src/data/matches.ts");
const TOPSCORERS = resolve(ROOT, "src/data/topScorers.ts");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (c) => RESULT_ALIAS[c] || c;
const pairKey = (a, b) => [a, b].sort().join("|");

/** Fetch a page's raw wikitext via the MediaWiki API, with retry/backoff. */
async function getWikitext(page) {
  const url = `${API}?action=parse&prop=wikitext&format=json&formatversion=2&page=${encodeURIComponent(page)}`;
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await sleep(1500 * attempt);
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${page}`);
      if (/too many requests/i.test(text)) throw new Error(`rate-limited on ${page}`);
      const json = JSON.parse(text);
      if (json.error) throw new Error(`API error ${json.error.code} for ${page}`);
      return json.parse.wikitext;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/** Capture a full {{...}} template starting at index i (brace-balanced). */
function templateAt(wt, i) {
  let depth = 0;
  for (let k = i; k < wt.length; k++) {
    if (wt[k] === "{" && wt[k + 1] === "{") { depth++; k++; }
    else if (wt[k] === "}" && wt[k + 1] === "}") { depth--; k++; if (depth === 0) return wt.slice(i, k + 1); }
  }
  return wt.slice(i);
}

/** Parse a football-box template body into {a,b,sa,sb} (sa/sb null if unplayed). */
function parseBox(body) {
  const t1 = body.match(/team1=\{\{#invoke:flag\|[^|]*\|([A-Z]{3})/);
  const t2 = body.match(/team2=\{\{#invoke:flag\|[^|]*\|([A-Z]{3})/);
  if (!t1 || !t2) return null;
  // score link has 2 or 3 params: {{score link|anchor|X–Y}} or {{score link|anchor|X–Y|article}}
  const sc = body.match(/score=\{\{score link\|[^|]*\|(\d+)[–-](\d+)(?:\|[^}]*)?\}\}/);
  return {
    a: norm(t1[1]), b: norm(t2[1]),
    sa: sc ? parseInt(sc[1], 10) : null,
    sb: sc ? parseInt(sc[2], 10) : null,
  };
}

/** Collect results from one group page, plus titles of split-out match articles. */
function parseGroup(wt) {
  const boxes = [];
  const re = /\{\{#invoke:football box\|main/gi;
  let m;
  while ((m = re.exec(wt))) {
    const r = parseBox(templateAt(wt, m.index));
    if (r) boxes.push(r);
  }
  const splitTitles = [...wt.matchAll(/\{\{main\|([^|}]+ v [^|}]+ \(2026 FIFA World Cup\))\}\}/g)].map((x) => x[1].trim());
  return { boxes, splitTitles };
}

function cleanScorerName(raw) {
  let s = raw.replace(/&nbsp;/g, " ");
  if (s.includes("|")) s = s.slice(s.lastIndexOf("|") + 1);
  return s.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

async function main() {
  // ---- 1. Gather results from all 12 group pages ----
  const results = {};
  const splitTitles = new Set();
  for (const g of GROUPS) {
    const wt = await getWikitext(`2026 FIFA World Cup Group ${g}`);
    const { boxes, splitTitles: st } = parseGroup(wt);
    for (const r of boxes) results[pairKey(r.a, r.b)] = r;
    st.forEach((t) => splitTitles.add(t));
    await sleep(400);
  }

  // ---- 2. Split-out match articles (e.g. notable matches with their own page) ----
  for (const title of splitTitles) {
    const wt = await getWikitext(title);
    const idx = wt.search(/\{\{#invoke:football box\|main/i);
    if (idx === -1) continue;
    const r = parseBox(templateAt(wt, idx));
    if (r) results[pairKey(r.a, r.b)] = r;
    await sleep(400);
  }

  const played = Object.values(results).filter((r) => r.sa !== null).length;
  if (Object.keys(results).length < 60) {
    throw new Error(`Implausibly few results parsed (${Object.keys(results).length}); aborting without writing.`);
  }

  // ---- 3. Update matches.ts score columns by team pair ----
  const src = readFileSync(MATCHES, "utf8");
  const eol = src.includes("\r\n") ? "\r\n" : "\n"; // preserve the file's newline style
  const lineRe = /^(\s*\[\s*"[A-L]",\s*[123],\s*"[\d-]+",\s*"[\d:]+",\s*"([A-Z]{3})",\s*"([A-Z]{3})",\s*"[A-Z]+",\s*)(?:null|\d+)\s*,\s*(?:null|\d+)(\s*\],?)\s*$/;
  let updated = 0;
  const lines = src.split(/\r?\n/).map((ln) => {
    const m = ln.match(lineRe);
    if (!m) return ln;
    const [, head, ta, tb, tail] = m;
    const r = results[pairKey(ta, tb)];
    // Only ever WRITE a real played result. Never downgrade to null: an unplayed
    // match, a missing pair, or a parse miss leaves the existing line untouched,
    // so a transient hiccup can't erase a good score.
    if (!r || r.sa === null) return ln;
    const flip = r.a !== ta;
    const newLine = `${head}${flip ? r.sb : r.sa}, ${flip ? r.sa : r.sb}${tail}`;
    if (newLine !== ln) updated++;
    return newLine;
  });
  writeFileSync(MATCHES, lines.join(eol));

  // ---- 4. Regenerate topScorers.ts (top 10 real) ----
  const gwt = await getWikitext(SCORERS_PAGE);
  const gblock = gwt.slice(gwt.indexOf("data.goalscorers"), gwt.indexOf("data.owngoalscorers"));
  const scorers = [...gblock.matchAll(/\{\s*"\[\[([^\]]+)\]\]"\s*,\s*"([A-Z]{3})"\s*,\s*(\d+)\s*\}/g)]
    .map((m, idx) => ({ name: cleanScorerName(m[1]), code: norm(m[2]), goals: +m[3], idx }));
  if (scorers.length < 5) throw new Error("Too few goalscorers parsed; aborting topScorers write.");
  scorers.sort((a, b) => b.goals - a.goals || a.idx - b.idx);
  const top = scorers.slice(0, 10);

  let ts = `/**\n * Golden Boot race — leading goal-scorers of the 2026 World Cup.\n *\n`;
  ts += ` * Real tournament data, auto-refreshed from Wikipedia's goalscorers module\n`;
  ts += ` * (Module:Goalscorers/data/2026 FIFA World Cup) by scripts/refresh-results.mjs.\n`;
  ts += ` * \`teamCode\` is a team \`fifaCode\` so the UI can render the right flag.\n */\n`;
  ts += `export interface ScorerEntry {\n  name: string;\n  teamCode: string;\n  goals: number;\n}\n\n`;
  ts += `export const topScorers: ScorerEntry[] = [\n`;
  for (const s of top) ts += `  { name: ${JSON.stringify(s.name)}, teamCode: ${JSON.stringify(s.code)}, goals: ${s.goals} },\n`;
  ts += `];\n`;
  // Match the existing file's newline style so unchanged data produces no diff.
  let tsEol = "\n";
  try { tsEol = readFileSync(TOPSCORERS, "utf8").includes("\r\n") ? "\r\n" : "\n"; } catch {}
  writeFileSync(TOPSCORERS, ts.replace(/\n/g, tsEol));

  console.log(`Parsed ${Object.keys(results).length} pairs (${played} played). matches.ts lines updated: ${updated}.`);
  console.log(`Top scorer: ${top[0].name} (${top[0].code}, ${top[0].goals}).`);
}

main().catch((e) => { console.error("refresh-results failed:", e.message); process.exit(1); });
