# POV GoalMap — TODO

> Status as of 2026-06-24. Branch `master`, working tree clean.
> Full context lives in [HANDOFF.md](HANDOFF.md).

## 🔜 Next up (do first)
- [ ] **Nothing pending.** Latest changes (adult avatars `e6903c5`, map/mobile UI
      fixes `5cc2b84`) are verified and **deployed**. Ask the user to hard-refresh
      (Ctrl+Shift+R) to confirm live, then pick the next item below.

> ⚙️ **Deploy policy:** auto build + deploy after every completed change (don't
> ask each time) — `npm run build` + robocopy mirror (HANDOFF §10).

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
