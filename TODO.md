# POV GoalMap — TODO

> Status as of 2026-06-25. Branch `main`, working tree clean.
> Full context lives in [HANDOFF.md](HANDOFF.md).

## 🔜 Next up (do first)
- [ ] **(Optional) Switch live primary to API-Football.** The backend is LIVE at
      povatlas.com/api/live-scores (Vercel-from-source), currently using the
      TheSportsDB fallback (`"source":"thesportsdb"`). To make API-Football the
      primary, set the `API_FOOTBALL_KEY` env var in Vercel + Redeploy (DEPLOY.md
      §E). Until then TheSportsDB works fine.
- Deploy is now **`git push`** (branch `main` → `sean519/POVAtlas` → Vercel).
  Robocopy flow is retired — see HANDOFF §10.

> ⚙️ **Deploy policy:** auto-deploy after every completed change (don't ask each
> time) — just `git push` from the canonical folder; Vercel builds it (HANDOFF §10).

## 📦 Medium priority
- [ ] **Knockout stage** (Round of 32 → Final). Only the 72-match group stage is
      modelled in `src/data/matches.ts`; standings/stats don't cover knockouts.
- [ ] **Re-sync fixture scores / Golden Boot after later matchdays.** Results +
      scorers were refreshed from official data through 2026-06-25 (group stage in
      progress). Re-run the Wikipedia parse (HANDOFF §9) to pull MD3 + knockouts
      as they're played.

## 🧊 Low priority / stretch
- [ ] **Improve live data (optional).** Backend `/api/live-scores` (API-Football +
      TheSportsDB fallback) is built. Follow-ups: auto-fetch Golden Boot scorers;
      surface goal-scorer events (already in `Match.live.events`) in the match
      detail; grow the alias table if a fixture fails to map; add a 3rd provider.
- [ ] **Expose the Leaflet map on `window` in dev** so the easter egg can be
      triggered from `preview_eval` (see Known bug #1 in HANDOFF).
- [ ] **Add tests / ESLint.** Currently the only check is `npm run lint`
      (`tsc --noEmit`) + manual browser verification.

## ✅ Done this session
- [x] **Stats now use real WC2026 data** — refreshed `matches.ts` scorelines
      from official group-stage results (parsed from Wikipedia football boxes;
      CAN-SUI→1-2, ECU-GER 2-1, CUW-CIV 0-2) and regenerated `topScorers.ts`
      from the real goalscorers module (Messi 5, Vinícius/Mbappé/Haaland 4…);
      dropped the "illustrative" label — `2aaa069`
- [x] **Mission & Vision** recorded; reframed POV Atlas as an interactive atlas
      for everyone (not a kids-only site) in README + HANDOFF §1 — `f716a20`
- [x] **Full 26-player squads for all 48 teams** (`src/data/squads.ts`, 1,248
      players, official WC2026 data parsed from Wikipedia wikitext). New
      `SquadMember` type + `getSquad()`; Squad tab shows the full roster grouped
      GK/DF/MF/FW with number + club, stars tappable into profiles; Players tab
      unchanged — `9f42829` (infra+Group A), `a9697ce` (all 48)
- [x] `/api/live-scores` backend (Vercel Edge): API-Football primary +
      TheSportsDB fallback, 60s cache, key via env, pluggable providers; frontend
      shows minute/red-cards/HT-FT + "Last updated", polls 30s only when live;
      graceful fallback to direct TheSportsDB on the static host — `f711b18`
- [x] Auto-fetch live World Cup scores client-side (TheSportsDB free API);
      overlay onto fixtures; standings/stats recompute from live data; deployed
      — `efef041`
- [x] Kickoff-aware match status (PDT date+time): no more false "Live" before
      kickoff; scheduled→live→finished; live scores feed standings; fixed a tz
      double-offset bug; deployed — `e8b45ae`
- [x] Selected-country highlight is now border-only (no gold fill); deployed
      — `c5835fc`
- [x] Soften country highlight (light gold), remove the focus-box rectangle, fix
      mobile info-card collapse/close buttons; deployed — `5cc2b84`
- [x] Real photo avatars for the 6 OC adults (all 12 members now have avatars);
      deployed — `e6903c5`
- [x] Lighten the avatar zoom: soft scrim + spring-from-tap animation; built &
      deployed to povatlas.com — `f5d881c`
- [x] New 512×512 kid avatars + tap-to-enlarge zoom lightbox in the OC easter
      egg (`EasterEggModal.tsx`, `public/avatars/*`) — `77b65e1`
- [x] "📍 Must-see places" tourist attractions for all 48 countries
      (`countryFacts.ts`, `types.ts`, `CountryDetailPanel.tsx`) — `f3363df`
- [x] Real cartoon PNG avatars for the 6 OC kids; removed hand-drawn
      `kidAvatars.ts` — `0ca635e`
- [x] Avatar oval fix (fixed square circular frame) — `ead0328`

## ✅ Done earlier (recent context)
- [x] Drag animation follow + snap-back; ET→PDT time correction; removed
      welcome hint — `a5f2009`
- [x] Kickoff timezone label (`KICKOFF_TZ` / `formatKickoff`) — `5576ad5`
- [x] Mobile drag-to-minimise info card — `be4df78`
- [x] Real 2026 WC fixtures + Google-style Stats + Golden Boot — `27ff38f`
- [x] Real OC roster + rotating random cheers + full player bios — `3543854`
