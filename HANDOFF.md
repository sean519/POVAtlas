# POV GoalMap — Session Handoff

> Last updated: 2026-06-25 (Vercel-from-source live; canonical folder moved) · Branch: `main` · Working tree: **clean** · Live on povatlas.com
>
> 📂 **Canonical project folder: `C:\Resilio Sync\Alltek-Sean\Github\POVAtlas`**
> (Resilio-synced across machines AND the git clone Vercel builds). Work here, not
> in `F:\world map` (a retired duplicate clone).
>
> ✅ **Deploy is Vercel-builds-from-source (since 2026-06-25).** This folder has
> remote `origin = github.com/sean519/POVAtlas` (branch **main**); `git push`
> → Vercel builds (`npm run build`) + runs the `api/` Edge functions → povatlas.com
> (DNS on Cloudflare). **The old robocopy→static flow is retired.**
> `/api/live-scores` is **live**; it currently uses the TheSportsDB fallback —
> set `API_FOOTBALL_KEY` in Vercel env to switch the primary to API-Football
> (DEPLOY.md §E).
>
> **Deploy policy:** the user wants every completed change auto-deployed without
> being asked each time — now just `git push` (Vercel builds it; §10).

This document is the single source of truth for picking up work on this project
in a fresh Claude Code session. Read it top-to-bottom before making changes.

> **Final cleanup pass done (HEAD `2eaa5a6`).** Whole project reviewed: no
> `console.log`/`debugger`/temp code; `tsconfig` has `noUnusedLocals` +
> `noUnusedParameters` enabled and the build is green, so there are **zero unused
> imports/locals** by construction; removed two dead exported helpers
> (`getContinents`, `getOpponentCode`); all 16 components are referenced; build
> artifacts are gitignored. The production build is clean. (Live data is now a
> real integration — see the `/api/live-scores` backend + `src/providers/`.)

---

## 1. Project overview

**POV Atlas** (formerly "POV GoalMap" / "World Cup Geography Map", domain
**POVatlas.com**) is an interactive atlas that turns global **events** into
gateways for exploring the world. The first event lens is the **2026 FIFA World
Cup** (USA · Canada · Mexico).

> **Mission:** POV Atlas helps people understand the world through sports,
> geography, culture, and data.
> **Vision:** Build the world's most engaging interactive atlas, where every event
> becomes a gateway to discovering countries, cultures, history, and the stories
> that connect our world.

It is **not** only a kids' site — it's for anyone curious about the world; the
optional Learn Mode just makes the same content approachable for younger readers.
The platform is designed to extend to other global events over time.

The user explores an interactive world map where every qualified nation is
clickable. Selecting a team opens a country profile (facts, fun facts, must-see
tourist sights, star players); selecting a match opens a head-to-head country
comparison with an estimated win chance. There are also tabs for the full match
schedule, group standings, tournament stats, and a ranked players list.

It is a **front-end static app** — no backend, no database, no API keys. Data is
hand-curated in `src/data/*.ts`, but **live match scores are now auto-fetched**
client-side from TheSportsDB's free CORS API (`src/utils/liveScores.ts`, polled
every 60s) and overlaid onto the bundled fixtures. Flag images come from the
public `flagcdn.com` CDN; everything else is bundled. (Aside from those two
public CDNs the app is self-contained — if the score feed is down it silently
keeps the bundled fixture data.)

There is a **hidden easter egg**: zooming the map deep into Orange County, CA
reveals the "OC居委会 大本营" — a card of the real friend group (6 adults + 6
kids) with cartoon avatars and tappable cheers. This is a personal touch for the
intended audience.

Tone throughout: **welcoming and accessible, bilingual (English + Simplified
Chinese)** — clear enough for kids (via Learn Mode) but substantive for adults.

---

## 2. Current architecture

- **Stack:** React 18 + TypeScript (strict) + Vite 5 + Tailwind CSS v3.
- **Map:** React-Leaflet v4 over Leaflet 1.9; OpenStreetMap-style tiles.
- **No router** — a single `App.tsx` holds all selection/hover state and passes
  it down. Tabs are switched inside `Layout`/`SchedulePanel`, not via URLs.
- **No state library** — plain `useState`/`useMemo` in `App.tsx`. Selection
  state (`selectedTeamCode`, `selectedMatchId`, hover equivalents, search term,
  collapse flag, easter-egg flag, selected player) all live at the top.
- **Data flow:** static arrays in `src/data/` → helper selectors in
  `src/utils/dataHelpers.ts` → presentational components. Components are mostly
  pure/presentational; `App.tsx` is the only real controller.
- **Styling:** Tailwind utility classes + a few custom keyframes/classes in
  `src/index.css` (e.g. `egg-pop`, `egg-bounce`, `animate-fade-in-up`,
  `nice-scroll`). Brand colors are defined in `tailwind.config.js`
  (`brand-navy`, `brand-blue`, `brand-sky`, `brand-pitch`, `brand-gold`,
  `brand-peach`).
- **Responsive:** desktop shows a left schedule panel + map with a floating
  info card bottom-right; mobile collapses to tabs and a bottom-sheet info card
  that can be dragged down to minimise (`MapInfoSheet` in `App.tsx`).

### Key types (`src/types.ts`)
`Team`, `Match`, `CountryFacts` (now includes optional `topAttractions`),
`StarPlayer`, `CountryComparison`, `WinChance`, `StandingRow`,
`TournamentStats`, plus `Group` / `Continent` / `MatchStatus` unions.

---

## 3. Current directory structure

```
C:\Resilio Sync\Alltek-Sean\Github\POVAtlas\   (canonical; F:\world map is a retired clone)
├─ HANDOFF.md                ← this file
├─ TODO.md                   ← prioritized remaining work
├─ README.md
├─ DEPLOY.md                 ← Vercel + custom-domain + §E live-scores backend
├─ api/
│  ├─ live-scores.ts         ← Vercel Edge fn: live provider chain + 60s cache (in-progress)
│  ├─ results.ts             ← Vercel Edge fn: COMPLETE finished results parsed live from
│  │                            Wikipedia, CDN-cached 5 min (primary finished-score source)
│  └─ knockout.ts            ← Vercel Edge fn: knockout bracket (rounds/dates/teams/scores)
│                                parsed live from the Wikipedia knockout page, CDN-cached 5 min
├─ index.html
├─ package.json / package-lock.json
├─ vite.config.ts            ← dev server on port 5180
├─ tailwind.config.js / postcss.config.js
├─ tsconfig.json / tsconfig.node.json
├─ vercel.json
├─ public/
│  ├─ CNAME                  ← povatlas.com (custom domain)
│  ├─ favicon.svg
│  └─ avatars/               ← 6 kid cartoon PNGs (512×512, ~70-100KB each,
│                                256-color quantized; tap to enlarge in the egg)
│     ├─ Clark.png  Bradley.png  Ryland.png
│     └─ Remi.png   Lucas.png    Lawrence.png
└─ src/
   ├─ main.tsx               ← React entry
   ├─ App.tsx                ← root controller; MapInfoSheet, CollapsedBar, WelcomeHint live here
   ├─ index.css              ← Tailwind + custom keyframes/classes
   ├─ types.ts               ← all shared domain types
   ├─ components/
   │  ├─ Layout.tsx          ← shell, tab switching, mobile nav
   │  ├─ WorldMap.tsx        ← Leaflet map, highlights, country-link arc, easter-egg trigger
   │  ├─ SchedulePanel.tsx   ← left pane: tabs (Matches/Teams/Standings/Stats/Players) + search
   │  ├─ MatchCard.tsx       ← one match row (uses formatKickoff for tz label)
   │  ├─ CountryDetailPanel.tsx ← team profile incl. "📍 Must-see places"
   │  ├─ CountryComparisonCard.tsx ← match → two-country comparison
   │  ├─ StatsView.tsx       ← Google-style tournament stats + Golden Boot
   │  ├─ StandingsView.tsx   ← group tables
   │  ├─ PlayersView.tsx     ← players ranked by fame
   │  ├─ PlayerModal.tsx     ← player bio/buzz modal
   │  ├─ StarPlayers.tsx     ← star-player list (shared)
   │  ├─ EasterEggModal.tsx  ← OC roster card (avatars + cheers)
   │  ├─ Flag.tsx / TeamBadge.tsx / WinChanceBar.tsx
   ├─ data/
   │  ├─ teams.ts            ← all 48 teams (codes, iso, group, lat/lng)
   │  ├─ countryFacts.ts     ← per-country facts + topAttractions (all 48)
   │  ├─ matches.ts          ← explicit 2026 fixture table (72 group matches)
   │  ├─ topScorers.ts       ← Golden Boot leaderboard (illustrative)
   │  ├─ teamExtras.ts       ← curated star players + bios per team (feeds Players tab)
   │  ├─ squads.ts           ← full 26-player squads for all 48 teams (official WC2026)
   │  └─ easterEgg.ts        ← OC roster (adults emoji, kids avatarUrl) + trigger geo box
   ├─ providers/             ← live-score providers (pure mappers + fetch)
   │  ├─ apiFootball.ts      ← API-Football (primary; key passed in, server-only fetch)
   │  └─ theSportsDb.ts      ← TheSportsDB (free fallback; also the frontend direct fallback)
   └─ utils/
      ├─ dataHelpers.ts      ← selectors: getTeamByCode, compareCountries, standings, stats, win chance
      ├─ formatters.ts       ← number/date formatting; KICKOFF_TZ + formatKickoff
      ├─ liveScores.ts       ← frontend loader: /api/live-scores → direct-TheSportsDB fallback
      ├─ teamNameMatch.ts    ← shared provider-name → fifaCode resolver + alias table
      ├─ flags.ts            ← flagcdn.com URL builder
      └─ groupColors.ts      ← per-group color classes
```

---

## 4. Features already completed

- Interactive Leaflet world map; click/hover a country to select; highlighted
  countries + an arc connecting the two teams of a selected match.
- Five left-pane tabs: **Matches, Teams, Standings, Stats, Players** + live
  search filter across teams and matches.
- **Country profile** (`CountryDetailPanel`): two tabs — **Country** (capital/
  region/population/GDP/area/languages/currency/neighbors, short intro, **📍
  Must-see places**, that team's matches) and **Squad**.
- **Squad tab** (`Squad.tsx` + `src/data/squads.ts`): the full **26-player
  roster** for all 48 teams (official WC2026: shirt number + position + club),
  grouped GK/DF/MF/FW. Members who are curated stars (`teamExtras.ts`) show a ⭐
  and are tappable into the player profile modal; others render as plain rows.
  `getSquad(code)` returns the roster, falling back to the star list if absent.
  The data was parsed deterministically from the Wikipedia squads wikitext (see
  `/tmp` generator in session history), NOT hand-typed — accuracy matters.
- **Country comparison** (`CountryComparisonCard`): side-by-side stats with
  winner arrows, estimated win-chance bar, star players for both, kid summary.
- **Real 2026 WC fixtures** (`matches.ts`): explicit 72-match group stage with
  real dates, venues, and scorelines. Match status (finished/live/scheduled) is
  derived from the device's current date, so it "updates" day to day.
- Kickoff times labelled with timezone via `KICKOFF_TZ` (**currently "PDT"**)
  and `formatKickoff()`.
- **Google-style Stats** (`StatsView`): hero tiles (goals, matches, goals/match,
  teams scored) + Golden Boot leaderboard + team goals + biggest win + most
  goals in a match.
- **Players tab** ranked by `fame`, with a profile modal (bio + light "buzz").
- **Mobile bottom-sheet** info card with drag-down-to-minimise gesture
  (`MapInfoSheet`, pointer events, follows finger, snaps back below threshold).
- **Hidden OC easter egg** (`EasterEggModal`): real roster — adults Sean, Roy,
  Han, Sharon, Emily, Clair (emoji) and kids Clark, Bradley, Ryland, Remi,
  Lucas, Lawrence (**real cartoon PNG avatars**). Each member has multiple
  cheers, one chosen at random per tap; "全体欢呼" bounces everyone.
- Custom domain wiring (`public/CNAME` = povatlas.com), Vercel config.

---

## 5. Features currently in progress

**None.** The working tree is clean and every requested change this session is
committed, built, and deployed. The last task (kid-avatar oval fix) is finished.

---

## 6. Remaining TODO items (prioritized)

See `TODO.md` for the live checklist. Summary, highest priority first:

1. **Confirm the avatar oval fix on the user's device.** Code renders perfect
   circles in testing; the user's oval was almost certainly browser cache. Ask
   them to hard-refresh (Ctrl+Shift+R) and confirm. If still oval, capture a
   real screenshot from their viewport (see Known bugs #1 for why screenshots
   were hard).
2. **Optional adult cartoon avatars.** Kids now have real PNG avatars; adults
   (Sean/Roy/Han/Sharon/Emily/Clair) still use emoji. If the user supplies
   images, drop them in `public/avatars/`, add `avatarUrl` in `easterEgg.ts`
   `OC_ADULTS`, and the existing `EasterEggModal` render path already supports
   it.
3. **Knockout stage.** Only the 72-match group stage exists. Round of 32 →
   final is not modelled in `matches.ts` or standings.
4. **Verify/refresh fixture scores** closer to/after real matchdays; scores are
   a snapshot and several are illustrative.
5. **Replace illustrative Golden Boot tallies** (`topScorers.ts`) with real data
   if/when desired — currently labelled as illustrative in the UI.
6. **Live data integration — DONE (backend `/api/live-scores` + fallback).**
   API-Football primary (needs a PAID plan for 2026 — free plan blocks the season)
   then TheSportsDB free fallback; the frontend (`src/utils/liveScores.ts`) calls
   the route, falling back to direct TheSportsDB if the route is absent. Currently
   running on the **TheSportsDB fallback** (user chose not to pay for API-Football;
   `API_FOOTBALL_KEY` unset). Follow-ups: auto-fetch Golden Boot scorers; surface
   `Match.live.events` (goal scorers) in the detail; grow the alias table.

---

## 7. Known bugs and technical debt

1. **Easter egg is hard to verify automatically.** It only opens by zooming the
   Leaflet map into the OC geo box (`OC_TRIGGER` in `easterEgg.ts`). The map
   instance is not exposed globally and isn't reachable via the React fiber
   chain, so it can't be triggered from `preview_eval`. `preview_screenshot`
   also **times out (~30s)** because the Leaflet map is heavy. Verification this
   session was done by cloning the exact avatar markup into the live DOM and
   measuring `getBoundingClientRect()` — a reliable workaround. Consider
   exposing the map instance on `window` in dev for easier testing.
2. **Timezone label is a fixed string, not a real conversion.** `KICKOFF_TZ`
   = "PDT" and times in `matches.ts` were manually converted from the official
   Eastern schedule (subtract 3h; three late ET fixtures roll back a day —
   noted in inline comments). There is no `Intl`/Date tz math; if the schedule
   source changes, times must be re-edited by hand. (Note: earlier commits said
   "PST"; it was corrected to "PDT" since June is daylight time.)
3. **Match status is derived from the device clock (kickoff-aware).**
   `statusFor(date, time)` now uses the PDT wall clock (`todayInKickoffTz()` /
   `nowMinutesInKickoffTz()` in `formatters.ts`): finished before match day,
   scheduled after, and on match day scheduled→live (kickoff..+115 min)→finished.
   So it still shifts with the real date/time, but no longer falsely marks a
   whole day "live" before kickoff. Live matches show their score if one is set
   in `FIXTURES`, and standings/stats count any match with a score (`hasScore`).
   The tz math lives in `clockInKickoffTz()` — it shifts the absolute time by the
   `KICKOFF_UTC_OFFSET_HOURS` and reads `getUTC*` (don't re-add
   `getTimezoneOffset()`; that double-shift returned UTC and broke "today").
4. **Avatar PNGs are committed to the repo** (~210KB total). Fine for now, but
   they are binary assets in git.
5. **No automated tests / no ESLint.** `npm run lint` is just `tsc --noEmit`.
   Type-check + manual browser verification is the only safety net.
6. **Scores/scorers are now real but a point-in-time snapshot** (refreshed from
   official data through 2026-06-25, group stage in progress). `matches.ts`
   scorelines come from the Wikipedia per-group football boxes and `topScorers.ts`
   from the goalscorers data module; re-run the parse (§9) to pull later
   matchdays. Live auto-fetched results still override bundled scores when the
   feed covers a match.
7. **Finished-match coverage is now complete via `/api/results`** (the runtime
   Wikipedia feed; `src/utils/liveScores.ts` merges it as the base, the live
   provider chain overlays in-progress). The old gap — TheSportsDB's free feed
   covers only *some* matches, so finished ones it missed showed "Full time"
   with a blank score until the slow GitHub cron caught up — is fixed: every
   finished match now appears within minutes. Remaining caveats: the live feed
   itself (for in-progress minute-by-minute) is still partial/best-effort, and
   the **Golden Boot is NOT in the runtime feed** — `topScorers.ts` is static,
   refreshed only by the 30-min cron (so it can lag), or via the §9 parse.
8. **Dev server runs from the RETIRED `F:\world map` clone, and Resilio is NOT
   syncing the canonical folder into it.** `.claude/launch.json` (used by the
   preview tools) only exists in `F:\world map`, so `preview_start` serves that
   clone. Edits in the canonical `C:\Resilio Sync\…\POVAtlas` folder do **not**
   reach the dev server automatically — Resilio→F sync was observed inactive
   (2026-06-25). **To verify locally, copy the changed `src/**` files into
   `F:\world map` first** (it's never committed/pushed — dev-only), then HMR
   picks them up. The real deploy is unaffected (Vercel builds from the Resilio
   git push). Long-term fix: add a launch.json in the canonical folder and run
   the dev server there, or re-enable Resilio sync for `src/`.
9. **Squad data is a point-in-time snapshot** (`src/data/squads.ts`): official
   26-player lists as announced; late post-build replacements won't update. The
   ⭐ profile link matches a squad member to a curated star by diacritic-
   insensitive name, so a star omitted from the squad just shows no ⭐ (e.g.
   RSA's Percy Tau isn't in the final 26, so he's absent from the Squad tab).

---

## 8. Important design decisions and why

- **Static, hand-curated data as the base, live scores overlaid.** Fixtures are
  hand-curated so the app always works; live results are then fetched and merged
  on top (`/api/live-scores` → `mergeLiveScores`). The hand-entered fixture scores
  remain the fallback for matches the live feed doesn't cover.
- **Explicit fixture table instead of procedural generation.** Earlier the app
  generated matches procedurally; it was replaced with a literal `FIXTURES`
  array so real dates/venues/scores are exact and easy to edit.
- **Date-derived match status.** Lets the schedule feel "alive" (auto-scrolls to
  today, marks live/finished) with zero backend.
- **Cheers as `string[]` (rotating), chosen randomly per tap.** The user
  specifically wanted a different cheer on every tap, so `EggMember.cheers` is
  an array and the modal picks `cheers[random]`.
- **Real PNG avatars over hand-drawn SVGs.** A prior step generated SVG cartoon
  faces (`kidAvatars.ts`); the user then supplied real cartoon portraits, which
  look far better, so the SVG file was deleted and `avatarUrl` paths used
  instead. Images were resized to 160×160 (from ~1.5MB to ~30-40KB) to keep the
  bundle light, since they render at ~56px.
- **Avatar wrapped in a fixed square circular frame.** To guarantee a perfect
  circle regardless of flex layout, the `<img>` sits inside a
  `h-14 w-14 shrink-0 overflow-hidden rounded-full` span with
  `aspect-ratio: 1/1`; the image fills it with `object-cover`. This was the fix
  for the reported "oval avatars".
- **Single `MapInfoSheet` wrapper for the mobile drag gesture.** Uses pointer
  events + `translateY` follow + a threshold to collapse, so both the team panel
  and comparison card get the same behaviour.
- **Tooltip/welcome hint removed** per user feedback ("tap a team or match" text
  was unnecessary clutter).

---

## 9. Files modified during this session

> **Data-refresh recipe (squads / results / scorers from Wikipedia).** All three
> were generated deterministically (no LLM summarizer — it hallucinated) by
> pulling raw wikitext via the MediaWiki API and parsing it with a small Node
> script. Endpoints:
> `…/w/api.php?action=parse&prop=wikitext&format=json&formatversion=2&page=<PAGE>`
> — `2026 FIFA World Cup squads` (one `{{nat fs g player}}` per row),
> `2026 FIFA World Cup Group A`…`Group L` (`{{#invoke:football box}}`: `team1`/
> `team2` = fifaCode, `score` = `X–Y`; one match — TUN-JPN — is split to its own
> article), and `Module:Goalscorers/data/2026 FIFA World Cup` (`data.goalscorers`
> list). Code aliases: results use ALG/HAI/IRN for app DZA/HTI/IRI. Rate-limit:
> space requests out. The throwaway scripts were in `%TEMP%` during the session.

This session's commits (newest first):

- `f711b18` — **Add `/api/live-scores` backend with API-Football + fallback** →
  new `api/live-scores.ts` (Vercel Edge fn: provider chain, 60s cache, key from
  `API_FOOTBALL_KEY`, stale-cache on failure); `src/providers/{apiFootball,
  theSportsDb}.ts` (pure mappers + fetch); `src/utils/teamNameMatch.ts` (shared
  name→fifaCode); `liveScores.ts` calls the route then falls back to direct
  TheSportsDB; `App.tsx` polls 30s only while live (`isLiveWindowNow`) else 5min,
  keeps last-good on failure; `MatchCard` shows minute/HT/red-cards; `SchedulePanel`
  shows "Last updated"; `types.ts` adds `LiveInfo`/`LiveMatchWire`/`Match.live`.
  Frontend deployed (uses fallback until Vercel). See DEPLOY.md §E.
- `efef041` — **Auto-fetch live World Cup scores (front-end, free API)** →
  new `src/utils/liveScores.ts` (polls TheSportsDB free key "3", CORS-OK; maps
  team names→fifaCode; yesterday/today/tomorrow UTC, sequential to dodge rate
  limits); `src/data/matches.ts` (`mergeLiveScores` overlay by unordered pair);
  `src/App.tsx` (poll every 60s into `liveMatches` state, threaded everywhere +
  `allMatches` prop); `dataHelpers` standings/stats/getMatchesForTeam take an
  optional matches arg; `SchedulePanel`/`StandingsView`/`StatsView` recompute
  from the live list. **Deployed.** This is the app's first network dependency.
- `e8b45ae` — **Kickoff-aware match status (fix everything-shows-Live bug)** →
  `src/data/matches.ts` (`statusFor(date, time)` scheduled→live→finished on the
  PDT clock; scores kept for live too); `src/utils/formatters.ts` (new
  `todayInKickoffTz`/`nowMinutesInKickoffTz`/`kickoffToMinutes`/
  `MATCH_DURATION_MINUTES`; **fixed** `clockInKickoffTz` double-offset that
  returned UTC); `src/components/MatchCard.tsx` ("Today"/"● In progress"/"● Live"/
  "Full time" labels + red live styling); `src/components/SchedulePanel.tsx`
  (Today section uses PDT). **Deployed.**
- `c5835fc` — **Selected-country highlight: border only, no fill** →
  `src/components/WorldMap.tsx` (focus `fillOpacity` 0.6→0, border weight 3; the
  transparent fill keeps the interior clickable). **Deployed.**
- `5cc2b84` — **Soften country highlight, drop focus box, fix mobile card buttons**
  → `src/components/WorldMap.tsx` (focus fill `#f6c453`@0.85→`#fbe2a0`@0.6, amber
  border); `src/index.css` (`.leaflet-interactive:focus{outline:none}` kills the
  rectangle around clicked countries); `src/App.tsx` (drag handle full-width→
  centred 112px so the mobile card's collapse/close buttons aren't covered).
  **Deployed.**
- `e6903c5` — **Real cartoon avatars for the six OC adults** →
  added `public/avatars/{Sean,Roy,Han,Sharon,Emily,Clair}.png` (512², quantized);
  `src/data/easterEgg.ts` (avatarUrl on `OC_ADULTS`). All 12 OC members now have
  photo avatars. **Deployed.**
- `f5d881c` — **Lighten avatar zoom: soft scrim + spring-from-tap animation** →
  `src/components/EasterEggModal.tsx` (scrim `navy/70 blur-md`→`navy/25 blur-[2px]`;
  enlarged card springs out of the tapped avatar's screen position via WAAPI
  `translate(origin) scale(0.25)`→settled, overshoot easing, 420ms,
  respects `prefers-reduced-motion`); `src/index.css` (`egg-zoom-scrim` fade).
  **Built + deployed** to povatlas.com (Resilio mirror; assets verified
  consistent; new 512² avatars live).
- `77b65e1` — **New 512×512 kid avatars + tap-to-enlarge zoom lightbox** →
  replaced all 6 `public/avatars/*.png` with the user's new portraits
  (center-cropped, 256-color quantized); `src/components/EasterEggModal.tsx`
  (zoom lightbox: tap a member → enlarged 224px portrait + name, tap big
  avatar to re-roll cheer; removed inline grid bubble; 🔍 hint badge);
  gitignored `profile/` source originals
- `2eaa5a6` — **Remove dead helpers** (`getContinents`, `getOpponentCode`) →
  `src/utils/dataHelpers.ts` (final-cleanup pass; bundle byte-identical)
- `ead0328` — **Fix kid avatars rendering as ovals** → `src/components/EasterEggModal.tsx`
- `0ca635e` — **Real cartoon photo avatars for the six OC kids** →
  added `public/avatars/{Clark,Bradley,Ryland,Remi,Lucas,Lawrence}.png`;
  `src/data/easterEgg.ts` (swap SVG→avatarUrl); `src/components/EasterEggModal.tsx`;
  **deleted** `src/data/kidAvatars.ts`
- `f3363df` — **"Must-see places" tourist attractions for every country** →
  `src/types.ts` (add `topAttractions`); `src/components/CountryDetailPanel.tsx`
  (render section); `src/data/countryFacts.ts` (3 attractions × 48 countries)

Immediately preceding context (from the continued session, already committed):
`a5f2009` (drag animation fix, ET→PDT time correction, remove welcome hint),
`5576ad5` (tz label), `be4df78` (mobile drag), `27ff38f` (real fixtures + stats),
`3543854` (OC roster + rotating cheers + bios).

---

## 10. Environment, dependencies, and commands

- **Automated data refresh:** `.github/workflows/refresh-results.yml` runs
  `scripts/refresh-results.mjs` every 30 min (cron `*/30`, + manual `workflow_
  dispatch`). It pulls official results (per-group football boxes) + Golden Boot
  (goalscorers module) from Wikipedia, updates ONLY the score columns of
  `matches.ts` and regenerates `topScorers.ts`, and commits only when something
  changed — which triggers a Vercel redeploy. It **only writes real scores
  (never nulls)** and aborts on fetch failure, so it can't wipe data. Repo is
  public → free Actions minutes. This keeps finished-match scores correct even
  when the runtime live feed (`/api/live-scores`) doesn't cover them. To refresh
  squads (rare), use the §9 recipe manually — squads are NOT auto-refreshed.
- **Node.js 18+** required (the refresh script needs Node 18+ for global
  `fetch`; CI uses Node 20). On this machine Node lives at
  `C:\Program Files\nodejs` (add to PATH in Bash:
  `export PATH="/c/Program Files/nodejs:$PATH"`).
- **Shell:** Windows. Use **PowerShell** for `robocopy` (Git Bash mangles
  `/MIR`-style flags into paths — see Deploy below). Git Bash is fine for git
  and node.
- **Install:** `npm install`
- **Dev server:** `npm run dev` → http://localhost:5180 (port set in
  `vite.config.ts` and `.claude/launch.json`). With Claude preview tools, start
  via `preview_start` with name **`dev`** (resolves to the `world-map` config).
- **Build:** `npm run build` (`tsc -b && vite build`) → outputs to `dist/`.
- **Type-check only:** `npm run lint` (`tsc --noEmit`).
- **No environment variables.** No `.env`, no secrets, no API keys.
- **Dependencies:** react, react-dom, react-leaflet, leaflet (runtime);
  typescript, vite, tailwindcss, postcss, autoprefixer, @vitejs/plugin-react,
  type defs (dev). See `package.json`.

### Deployment — Vercel builds from source (current, since 2026-06-25)
- Work in **`C:\Resilio Sync\Alltek-Sean\Github\POVAtlas`** (remote
  **`origin = github.com/sean519/POVAtlas`**, production branch **`main`**).
  Deploy by pushing source:
  ```powershell
  cd "C:\Resilio Sync\Alltek-Sean\Github\POVAtlas"; git add -A; git commit -m "…"; git push
  ```
  Resilio should ignore `node_modules`, `dist`, `.vercel`, `*.tsbuildinfo` so they
  don't sync across machines.
  Vercel auto-builds (`npm run build`, via `vercel.json`), deploys the `api/`
  Edge function, and serves povatlas.com (DNS managed on **Cloudflare**, already
  pointed at Vercel). Verify a deploy at `https://povatlas.com/api/live-scores`
  (should return JSON) and by loading the site.
- **`API_FOOTBALL_KEY`** is a Vercel env var (Settings → Environment Variables);
  it is the only secret. Without it the live feed uses the TheSportsDB fallback.
  See `DEPLOY.md` §E.
- **RETIRED:** the old `robocopy "…\dist" "…\Github\POVAtlas"` flow. That mirrored
  built static files into a separate git repo; the site is no longer served that
  way. Do **not** robocopy — it conflicts with the source build. The
  `C:\Resilio Sync\…\Github\POVAtlas` clone is now stale.

---

## 11. Current git status

- Branch: **`main`** · remote **`origin = github.com/sean519/POVAtlas`** (Vercel's
  production branch). `git push` deploys. (Renamed from `master` on 2026-06-25
  when wiring up Vercel-from-source; force-pushed source over the old static repo.)
- Working tree: **clean** — nothing uncommitted.
- `dist/`, `node_modules/`, and TS build artifacts (`*.tsbuildinfo`,
  `vite.config.js`, `vite.config.d.ts`, `.vite-*.log`, `.claude/`) are
  git-ignored. They may exist on disk after a build but are never committed.
- HEAD: latest doc/infra commit (run `git log --oneline -1`). Backend live on Vercel.

---

## 12. Recommended very next task

**Nothing outstanding — the backlog is at a clean stopping point.** All 12 OC
members now have photo avatars, the zoom is lightened, and the three reported map/
mobile issues (heavy yellow, focus-box rectangle, dead mobile card buttons) are
fixed, verified, committed (`5cc2b84`), and **deployed** to povatlas.com. Just ask
the user to **hard-refresh (Ctrl+Shift+R)** to see the live result.

Pick the next item from `TODO.md` when the user is ready — the biggest remaining
feature is the **knockout stage** (Round of 32 → Final), not yet modelled in
`src/data/matches.ts` or standings/stats. Remember to **auto-deploy** after any
change (see the deploy-policy note at the top).

> Note: the easter egg **can** now be triggered from `preview_eval` — the Leaflet
> map instance is reachable by walking the React fiber tree from the
> `.leaflet-container` DOM node (DFS, deep-scan `memoizedState`/`memoizedProps`
> for an object with `setView`/`getZoom`/`getContainer`). Call
> `map.setView([33.7455,-117.8677],11)` to reveal the 🏡 marker, then dispatch a
> `click` on `.oc-hq`'s `.leaflet-marker-icon` to open the modal. This makes the
> "expose map on window" TODO lower priority.
