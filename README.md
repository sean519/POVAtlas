# POV Atlas 🌍⚽

An interactive atlas that turns global **events** into gateways for discovering
the world. The first event lens is the **2026 FIFA World Cup**: pair the schedule
with an interactive world map and explore every nation's geography, culture, and
data — population, GDP, capital, languages, area, region, fun facts, must-see
places, and squads.

Built with **React + TypeScript + Vite + Tailwind CSS + React-Leaflet**.

![Layout: schedule on the left, interactive map in the middle, country info on the right.](https://img.shields.io/badge/stack-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind%20%7C%20Leaflet-11487f)

---

## Mission & Vision

**Mission:** POV Atlas helps people understand the world through sports,
geography, culture, and data.

**Vision:** Build the world's most engaging interactive atlas, where every event
becomes a gateway to discovering countries, cultures, history, and the stories
that connect our world.

> POV Atlas is **not** only a kids' website. It's an interactive atlas for anyone
> curious about the world — the optional **Learn Mode** simply makes the same
> content approachable for younger readers. The 2026 World Cup is the first event
> lens; the platform is designed to extend to other global events over time.

---

## Features

- 🚩 **Real country flags** (from flagcdn) on every team, plus **Chinese names**
  (中文国家名) alongside the English ones throughout the UI.
- 🗺️ **Interactive world map** (Leaflet) with country polygons **and** a flag
  marker for all 48 teams, so it works even if the border data can't load.
- 📅 **Full 2026 group-stage schedule** (72 matches) grouped by date, with group
  color labels and live / finished / upcoming statuses.
- 👥 **Browse all 48 teams** grouped A–L.
- ✨ **Hover a team** → it highlights on the map and dims the rest.
- 👆 **Click a team** → flies to the country and opens a detailed profile.
- ⚔️ **Click a match** → highlights both countries and opens a kid-friendly
  comparison card.
- 🔎 **Search** by country name, team name, FIFA code or group.
- 🎛️ **Filters**: group (A–L), continent, match status, and date.
- ↺ **Reset** button to clear selection and filters and recenter the map.
- 🎓 **Learn Mode** rewrites country details in simple language for ~10-year-olds.
- 📱 Responsive: side-by-side on desktop, tabbed (Schedule / Map / Info) on mobile.

---

## Getting started

### Prerequisites
- **Node.js 18+** and npm. (Check with `node -v`. If you don't have it, install
  from <https://nodejs.org>.)

### Install
```bash
npm install
```

### Run (development)
```bash
npm run dev
```
Then open the URL Vite prints (default <http://localhost:5173>).

### Build & preview (production)
```bash
npm run build
npm run preview
```

### Type-check only
```bash
npm run lint
```

> The map loads country borders from a public GeoJSON file over the network.
> If you're offline, borders are skipped and the app falls back to the team
> markers — everything else still works.

---

## Where to edit the data

All data lives in `src/data/` as plain TypeScript so there's no backend to run.

| What | File | Notes |
|------|------|-------|
| **Teams** | [`src/data/teams.ts`](src/data/teams.ts) | The 48 teams. Each has `fifaCode` (badges), `isoA3Code` (map polygons), `iso2` (flag image), and `nameZh` (Chinese name). Edit `lat`/`lng` to move a marker. |
| **Matches** | [`src/data/matches.ts`](src/data/matches.ts) | The full 2026 group stage (72 matches) generated from the team list following the real tournament structure. Tweak the `TODAY` date, the date/venue tables, or the round-robin `pairings` to adjust it. |
| **Country facts** | [`src/data/countryFacts.ts`](src/data/countryFacts.ts) | Keyed by `isoA3Code`. Population, GDP, capital, languages, neighbors, intro, fun facts and the kid-friendly summary. |

Helpful spots:
- Formatting (population, GDP, area, dates): [`src/utils/formatters.ts`](src/utils/formatters.ts)
- Lookups & comparison logic: [`src/utils/dataHelpers.ts`](src/utils/dataHelpers.ts)
- Group colors: [`src/utils/groupColors.ts`](src/utils/groupColors.ts)

### A note on England & Scotland
England and Scotland are football nations but **not** sovereign UN states, and
most world GeoJSON datasets only contain a single "United Kingdom" polygon. They
are marked with `isSovereignCountry: false`, given approximate center
coordinates, shown with a **marker** (not a national border), and carry the note:
_"This football team represents a constituent country of the United Kingdom."_
Curaçao and Cape Verde are also shown as markers because they are small islands.

---

## Project structure

```
src/
  App.tsx                     # State + wiring
  main.tsx                    # Entry point
  index.css                   # Tailwind + map/marker styles
  types.ts                    # Shared TypeScript types
  data/
    teams.ts                  # 48 teams
    matches.ts                # Sample schedule
    countryFacts.ts           # Country facts by ISO A3
  utils/
    formatters.ts             # formatPopulation / formatGDP / formatArea / dates
    dataHelpers.ts            # getTeamByCode, getMatchesForTeam, compareCountries, …
    groupColors.ts            # Per-group color tokens
  components/
    Layout.tsx                # Responsive shell + header + mobile tabs
    WorldMap.tsx              # Leaflet map, polygons, markers, fly-to
    SchedulePanel.tsx         # Schedule + team browser + filters
    MatchCard.tsx
    TeamBadge.tsx
    CountryDetailPanel.tsx    # Standard + Learn Mode views
    CountryComparisonCard.tsx
    SearchAndFilters.tsx
    LearnModeToggle.tsx
    Footer.tsx
```

---

## Data sources & disclaimer

Country facts are **approximate sample data for educational use**. Replace with
[World Bank](https://data.worldbank.org/),
[REST Countries](https://restcountries.com/) and an official World Cup schedule
for production. Map tiles © OpenStreetMap contributors / CARTO.

This is an independent learning project and is **not affiliated with or endorsed
by FIFA**. No official logos or branding are used.

---

## Future improvement ideas

- Fetch live country facts from the REST Countries / World Bank APIs.
- Real, up-to-date official fixtures with live scores.
- Use proper boundary GeoJSON for England, Scotland and other constituent nations.
- "Group standings" tables computed from results.
- Distance/“how far away is this country from me?” mode.
- A geography quiz/game mode (flags, capitals, currencies) with difficulty levels.
- Save Learn-Mode progress and favorites to `localStorage`.
- Internationalization (multiple UI languages).
- Accessibility polish (full keyboard navigation of the map).
```
