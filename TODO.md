# POV GoalMap — TODO

> Status as of 2026-06-24. Branch `master`, working tree clean.
> Full context lives in [HANDOFF.md](HANDOFF.md).

## 🔜 Next up (do first)
- [ ] **Confirm the new kid avatars + zoom on the live site.** New 512×512
      portraits + lightened spring-zoom lightbox shipped (`f5d881c`); verified in
      the preview browser and **deployed** to povatlas.com. Ask the user to
      hard-refresh (Ctrl+Shift+R) and re-open the OC easter egg to confirm live.

## ⬆️ High priority
- [ ] **Optional: real cartoon avatars for the 6 adults** (Sean, Roy, Han,
      Sharon, Emily, Clair). They still use emoji. If the user supplies images:
      drop PNGs in `public/avatars/`, add `avatarUrl` to `OC_ADULTS` in
      `src/data/easterEgg.ts`. `EasterEggModal` already renders `avatarUrl`.

## 📦 Medium priority
- [ ] **Knockout stage** (Round of 32 → Final). Only the 72-match group stage is
      modelled in `src/data/matches.ts`; standings/stats don't cover knockouts.
- [ ] **Refresh fixture scores** in `src/data/matches.ts` near/after real
      matchdays — current scores are a snapshot, some illustrative.
- [ ] **Replace illustrative Golden Boot tallies** in `src/data/topScorers.ts`
      with real data if desired (currently labelled illustrative in the UI).

## 🧊 Low priority / stretch
- [ ] **Live data integration.** `fetchLiveSchedule(endpoint)` seam exists in
      `matches.ts` but is unused; needs a backend/proxy (no free CORS FIFA API).
- [ ] **Expose the Leaflet map on `window` in dev** so the easter egg can be
      triggered from `preview_eval` (see Known bug #1 in HANDOFF).
- [ ] **Add tests / ESLint.** Currently the only check is `npm run lint`
      (`tsc --noEmit`) + manual browser verification.

## ✅ Done this session
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
