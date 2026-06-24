# POV GoalMap — Session Handoff

> Last updated: 2026-06-24 (post final-cleanup pass) · Branch: `master` · Working tree: **clean** (all work committed)

This document is the single source of truth for picking up work on this project
in a fresh Claude Code session. Read it top-to-bottom before making changes.

> **Final cleanup pass done (HEAD `2eaa5a6`).** Whole project reviewed: no
> `console.log`/`debugger`/temp code; `tsconfig` has `noUnusedLocals` +
> `noUnusedParameters` enabled and the build is green, so there are **zero unused
> imports/locals** by construction; removed two dead exported helpers
> (`getContinents`, `getOpponentCode`); all 16 components are referenced; build
> artifacts are gitignored. The production build is clean. `fetchLiveSchedule`
> in `matches.ts` is intentionally retained as the documented live-data seam.

---

## 1. Project overview

**POV GoalMap** (a.k.a. "World Cup Geography Map", product/domain name **POVatlas.com**)
is a kid-friendly, single-page web app that teaches world geography through the
**2026 FIFA World Cup** (USA · Canada · Mexico).

The user explores an interactive world map where every qualified nation is
clickable. Selecting a team opens a country profile (facts, fun facts, must-see
tourist sights, star players); selecting a match opens a head-to-head country
comparison with an estimated win chance. There are also tabs for the full match
schedule, group standings, tournament stats, and a ranked players list.

It is a **pure front-end static app** — no backend, no database, no API keys.
All data is hand-curated in `src/data/*.ts`. Flag images come from the public
`flagcdn.com` CDN; everything else is bundled.

There is a **hidden easter egg**: zooming the map deep into Orange County, CA
reveals the "OC居委会 大本营" — a card of the real friend group (6 adults + 6
kids) with cartoon avatars and tappable cheers. This is a personal touch for the
intended audience.

Tone throughout: **kid-friendly, bilingual (English + Simplified Chinese)**.

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
F:\world map\
├─ HANDOFF.md                ← this file
├─ TODO.md                   ← prioritized remaining work
├─ README.md
├─ DEPLOY.md                 ← Vercel + custom-domain instructions
├─ index.html
├─ package.json / package-lock.json
├─ vite.config.ts            ← dev server on port 5180
├─ tailwind.config.js / postcss.config.js
├─ tsconfig.json / tsconfig.node.json
├─ vercel.json
├─ public/
│  ├─ CNAME                  ← povatlas.com (custom domain)
│  ├─ favicon.svg
│  └─ avatars/               ← 6 kid cartoon PNGs (160×160, ~30-40KB each)
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
   │  ├─ teamExtras.ts       ← star players + bios per team
   │  └─ easterEgg.ts        ← OC roster (adults emoji, kids avatarUrl) + trigger geo box
   └─ utils/
      ├─ dataHelpers.ts      ← selectors: getTeamByCode, compareCountries, standings, stats, win chance
      ├─ formatters.ts       ← number/date formatting; KICKOFF_TZ + formatKickoff
      ├─ flags.ts            ← flagcdn.com URL builder
      └─ groupColors.ts      ← per-group color classes
```

---

## 4. Features already completed

- Interactive Leaflet world map; click/hover a country to select; highlighted
  countries + an arc connecting the two teams of a selected match.
- Five left-pane tabs: **Matches, Teams, Standings, Stats, Players** + live
  search filter across teams and matches.
- **Country profile** (`CountryDetailPanel`): capital/region/population/GDP/area/
  languages/currency/neighbors, short intro, **📍 Must-see places** (3 curated
  tourist sights per country — all 48 done), fun facts, star players, that
  team's matches.
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
6. **Live data integration (stretch).** `fetchLiveSchedule(endpoint)` exists in
   `matches.ts` as an integration point but is unused; would need a backend/proxy.

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
3. **Match status depends on the device clock.** `statusFor()` compares fixture
   dates to `todayISO()`. On 2026-06-24 (the date used while building), Groups
   A/B/C matchday 3 show as "live". Behaviour shifts with the real date.
4. **Avatar PNGs are committed to the repo** (~210KB total). Fine for now, but
   they are binary assets in git.
5. **No automated tests / no ESLint.** `npm run lint` is just `tsc --noEmit`.
   Type-check + manual browser verification is the only safety net.
6. **Scores/scorers are partly illustrative**, clearly labelled as such in the
   Stats UI, but worth remembering they are not all official.

---

## 8. Important design decisions and why

- **Static, hand-curated data over an API.** Target audience is kids/friends and
  the app must work offline-ish and deploy as a pure static site. Live FIFA data
  has no free public CORS-friendly API. `fetchLiveSchedule()` is left as a seam.
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

This session's commits (newest first):

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

- **Node.js 18+** required. On this machine Node lives at
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

### Deployment (two paths)
- **Resilio Sync (current live path):** after `npm run build`, mirror `dist/`
  into the Resilio folder, then it propagates to the host:
  ```powershell
  robocopy "F:\world map\dist" "C:\Resilio Sync\Alltek-Sean\Github\POVAtlas" /MIR /XD ".git" /NJH /NJS /NC /NS /NFL
  ```
  robocopy exit codes 0–7 are **success** (3 = files copied + extras removed).
  After syncing, verify `index.html`'s hashed JS/CSS refs match the files in the
  deployed `assets/` folder.
- **Vercel + povatlas.com:** see `DEPLOY.md` (Git remote not yet configured;
  `public/CNAME` already set).

---

## 11. Current git status

- Branch: **`master`** (note: PRs would normally target `main`, but this repo's
  working branch is `master` and there is no configured remote yet).
- Working tree: **clean** — nothing uncommitted.
- `dist/`, `node_modules/`, and TS build artifacts (`*.tsbuildinfo`,
  `vite.config.js`, `vite.config.d.ts`, `.vite-*.log`, `.claude/`) are
  git-ignored. They may exist on disk after a build but are never committed.
- HEAD: `2eaa5a6 Remove dead helpers getContinents and getOpponentCode`

---

## 12. Recommended very next task

**Confirm the kid-avatar fix on the user's actual device.** The fix is committed,
built, and deployed, and the markup measures as a perfect circle at every tested
width — so the most likely remaining cause of the oval the user saw is a stale
browser cache. Ask the user to **hard-refresh (Ctrl+Shift+R / clear site cache)**
and re-open the easter egg (zoom the map into Orange County). If it now shows
clean circles, close this out. If it still looks oval, the issue is
device/viewport-specific and worth a real screenshot from their browser DevTools
— but do not re-touch the CSS first, since it is already provably correct.

Good follow-on once confirmed: **optional adult cartoon avatars** (#2 in TODO) if
the user provides images — it's a small, well-understood change using the path
that already works for the kids.
