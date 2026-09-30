import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Layout from "./components/Layout";
import SchedulePanel from "./components/SchedulePanel";
import WorldMap, { type AtlasFrame, type AtlasTone } from "./components/WorldMap";
import type { ComparisonResult } from "./components/CountryComparisonCard";
import type { AtlasTab } from "./components/atlas/AtlasPanel";
import SectionSwitch, { type Section } from "./components/SectionSwitch";
import Flag from "./components/Flag";
import CountryFlag from "./components/atlas/CountryFlag";

// Loaded on demand: the country panels carry the heavy country-facts + squad
// data, and the modals are rarely opened — none are needed for first paint.
const CountryDetailPanel = lazy(() => import("./components/CountryDetailPanel"));
const CountryComparisonCard = lazy(() => import("./components/CountryComparisonCard"));
const EasterEggModal = lazy(() => import("./components/EasterEggModal"));
const PlayerModal = lazy(() => import("./components/PlayerModal"));
const AtlasPanel = lazy(() => import("./components/atlas/AtlasPanel"));
const AtlasCountryCard = lazy(() => import("./components/atlas/AtlasCountryCard"));
import type { KnockoutMatch, LiveScoresResponse, Match, StarPlayer, Team } from "./types";
import { teams } from "./data/teams";
import { matches, mergeLiveScores, isLiveWindowNow, isTournamentOver } from "./data/matches";
import { fetchLiveScores } from "./utils/liveScores";
import { ROUND_META, fetchKnockout } from "./utils/knockout";
import { getMatchesForTeam, getTeamByCode } from "./utils/dataHelpers";
import { getVenuePoint } from "./data/venues";
import { atlasCodeForTeam, useWorldData } from "./utils/world";
import { currentStreak, gameFor, puzzleNumber, useDaily } from "./utils/daily";

/** Shareable deep links: ?compare=CHN,IND and ?country=JPN. */
function readInitialLink(): { compare: [string, string] | null; country: string | null } {
  try {
    const p = new URLSearchParams(window.location.search);
    const code = (s: string | undefined) => (s && /^[A-Z]{3}$/.test(s.toUpperCase()) ? s.toUpperCase() : null);
    const [a, b] = (p.get("compare") ?? "").split(",");
    const ca = code(a);
    const cb = code(b);
    return { compare: ca && cb && ca !== cb ? [ca, cb] : null, country: code(p.get("country") ?? undefined) };
  } catch {
    return { compare: null, country: null };
  }
}
const initialLink = readInitialLink();

/** The single World Cup team for an Atlas country (none for the UK: 2 teams). */
function teamForAtlasCode(code: string): Team | undefined {
  const matchesCode = teams.filter((t) => atlasCodeForTeam(t) === code);
  return matchesCode.length === 1 ? matchesCode[0] : undefined;
}

export default function App() {
  // ---- Section (Atlas / World Cup) + Atlas state ----
  const [section, setSection] = useState<Section>("atlas");
  const [atlasTab, setAtlasTab] = useState<AtlasTab>(initialLink.compare ? "compare" : "today");
  const [atlasCountry, setAtlasCountry] = useState<string | null>(initialLink.country);
  const [compareA, setCompareA] = useState<string | null>(initialLink.compare?.[0] ?? null);
  const [compareB, setCompareB] = useState<string | null>(initialLink.compare?.[1] ?? null);
  const world = useWorldData();

  // Drop deep-linked codes that don't exist once the data has loaded.
  useEffect(() => {
    if (!world) return;
    if (atlasCountry && !world.byCode.has(atlasCountry)) setAtlasCountry(null);
    if (compareA && !world.byCode.has(compareA)) setCompareA(null);
    if (compareB && !world.byCode.has(compareB)) setCompareB(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  // ---- Mobile: bump to jump to the Browse panel (e.g. to see a comparison) ----
  const [focusPanelSignal, setFocusPanelSignal] = useState(0);
  const surfacePanel = () => setFocusPanelSignal((n) => n + 1);

  // Daily puzzle status for the header badge.
  const daily = useDaily();
  const puzzle = puzzleNumber();
  const todayGame = gameFor(daily, puzzle);

  // ---- Selection / hover state ----
  const [hoveredTeamCode, setHoveredTeamCode] = useState<string | null>(null);
  const [selectedTeamCode, setSelectedTeamCode] = useState<string | null>(null);
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [hoveredKnockoutId, setHoveredKnockoutId] = useState<string | null>(null);
  const [selectedKnockoutId, setSelectedKnockoutId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Whether the floating info card is collapsed to a small pill.
  const [infoCollapsed, setInfoCollapsed] = useState(false);

  // Hidden Orange County easter egg modal.
  const [eggOpen, setEggOpen] = useState(false);

  // Player profile modal.
  const [selectedPlayer, setSelectedPlayer] = useState<{
    team: Team;
    player: StarPlayer;
  } | null>(null);

  // ---- Mobile: bump to switch to the map tab (so the info card is visible) ----
  const [focusMapSignal, setFocusMapSignal] = useState(0);
  const surfaceMap = () => setFocusMapSignal((n) => n + 1);

  // ---- Live scores: poll the backend (/api/live-scores) and overlay results ----
  const [liveMatches, setLiveMatches] = useState<Match[]>(matches);
  const [liveMeta, setLiveMeta] = useState<{
    updatedAt: string;
    source: string;
    stale: boolean;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const tick = async () => {
      let res: LiveScoresResponse | null = null;
      try {
        res = await fetchLiveScores();
      } catch {
        res = null; // total failure → keep last good scores + last meta (req #9)
      }
      if (cancelled) return;
      if (res && res.matches.length > 0) {
        setLiveMatches(mergeLiveScores(matches, res.matches));
        setLiveMeta({ updatedAt: res.updatedAt, source: res.source, stale: res.stale });
      } else if (res) {
        setLiveMeta((prev) => prev ?? { updatedAt: res.updatedAt, source: res.source, stale: res.stale });
      }
      // Tournament over: scores are final, one fetch is enough.
      if (isTournamentOver()) return;
      // Poll every 30s only while a match is live; otherwise a slow heartbeat.
      const liveNow =
        isLiveWindowNow() || (res?.matches.some((m) => m.status === "live") ?? false);
      timer = window.setTimeout(tick, liveNow ? 30_000 : 5 * 60_000);
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  // Knockout bracket (auto-fills from Wikipedia as the tournament progresses).
  const [knockout, setKnockout] = useState<KnockoutMatch[]>([]);
  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const tick = async () => {
      const ko = await fetchKnockout().catch(() => []);
      if (cancelled) return;
      if (ko.length > 0) setKnockout(ko);
      if (isTournamentOver()) return; // bracket is final
      timer = window.setTimeout(tick, 10 * 60_000); // bracket changes slowly
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const term = searchTerm.trim().toLowerCase();

  // ---- Search-filtered lists ----
  const filteredTeams = useMemo(() => {
    if (!term) return teams;
    return teams.filter((t) =>
      [t.teamName, t.countryName, t.nameZh, t.fifaCode, t.isoA3Code, `group ${t.group}`]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [term]);

  const filteredMatches = useMemo(() => {
    if (!term) return liveMatches;
    return liveMatches.filter((m) => {
      const a = getTeamByCode(m.teamA);
      const b = getTeamByCode(m.teamB);
      return [
        a?.teamName,
        a?.nameZh,
        a?.fifaCode,
        b?.teamName,
        b?.nameZh,
        b?.fifaCode,
        `group ${m.group}`,
        m.venue,
        m.city,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [term, liveMatches]);

  // ---- Selection objects ----
  const selectedTeam = getTeamByCode(selectedTeamCode);
  const selectedMatch = selectedMatchId
    ? liveMatches.find((m) => m.matchId === selectedMatchId) ?? null
    : null;
  const selectedKnockout = selectedKnockoutId
    ? knockout.find((k) => k.id === selectedKnockoutId) ?? null
    : null;
  const hoveredKnockout = hoveredKnockoutId
    ? knockout.find((k) => k.id === hoveredKnockoutId) ?? null
    : null;
  // The two teams of the selected match (the comparison card itself loads the
  // country facts on demand).
  const pairCodes: [string, string] | null = selectedMatch
    ? [selectedMatch.teamA, selectedMatch.teamB]
    : selectedKnockout && selectedKnockout.teamA && selectedKnockout.teamB
    ? [selectedKnockout.teamA, selectedKnockout.teamB]
    : null;
  const pairA = pairCodes ? getTeamByCode(pairCodes[0]) : undefined;
  const pairB = pairCodes ? getTeamByCode(pairCodes[1]) : undefined;
  const comparison = pairCodes && pairA && pairB ? { codes: pairCodes, teamA: pairA, teamB: pairB } : null;
  const comparisonResult: ComparisonResult | null =
    selectedMatch && selectedMatch.status === "finished" &&
    selectedMatch.scoreA !== null && selectedMatch.scoreB !== null
      ? { scoreA: selectedMatch.scoreA, scoreB: selectedMatch.scoreB, stage: `Group ${selectedMatch.group}` }
      : selectedKnockout && selectedKnockout.scoreA !== null && selectedKnockout.scoreB !== null
      ? {
          scoreA: selectedKnockout.scoreA,
          scoreB: selectedKnockout.scoreB,
          stage: ROUND_META[selectedKnockout.round].label,
          note:
            selectedKnockout.penA != null
              ? `${selectedKnockout.penA}–${selectedKnockout.penB} pens`
              : selectedKnockout.aet
              ? "a.e.t."
              : undefined,
        }
      : null;

  // ---- Map highlight set + focus ----
  const highlightCodes = useMemo(() => {
    const set = new Set<string>();
    if (selectedTeamCode) set.add(selectedTeamCode);
    if (hoveredTeamCode) set.add(hoveredTeamCode);
    if (selectedMatch) {
      set.add(selectedMatch.teamA);
      set.add(selectedMatch.teamB);
    }
    if (hoveredMatchId) {
      const m = matches.find((mm) => mm.matchId === hoveredMatchId);
      if (m) {
        set.add(m.teamA);
        set.add(m.teamB);
      }
    }
    if (selectedKnockout) {
      if (selectedKnockout.teamA) set.add(selectedKnockout.teamA);
      if (selectedKnockout.teamB) set.add(selectedKnockout.teamB);
    }
    if (hoveredKnockout) {
      if (hoveredKnockout.teamA) set.add(hoveredKnockout.teamA);
      if (hoveredKnockout.teamB) set.add(hoveredKnockout.teamB);
    }
    return Array.from(set);
  }, [
    selectedTeamCode,
    hoveredTeamCode,
    selectedMatch,
    hoveredMatchId,
    selectedKnockout,
    hoveredKnockout,
  ]);

  const focusCode = selectedTeamCode;
  // When a match (group or decided knockout) is selected, frame + connect both
  // of its teams on the map.
  const fitCodes = selectedMatch
    ? [selectedMatch.teamA, selectedMatch.teamB]
    : selectedKnockout && selectedKnockout.teamA && selectedKnockout.teamB
    ? [selectedKnockout.teamA, selectedKnockout.teamB]
    : null;

  // The selected match's stadium — the ⚽ marker sits here and both teams'
  // arcs converge on it, so the venue is visible on the map.
  const matchVenue = useMemo(() => {
    const src =
      selectedMatch ??
      (selectedKnockout?.teamA && selectedKnockout.teamB ? selectedKnockout : null);
    if (!src) return null;
    const pt = getVenuePoint(src.venue);
    if (!pt) return null;
    const label = [src.venue, src.city].filter(Boolean).join(" · ");
    return { ...pt, label };
  }, [selectedMatch, selectedKnockout]);

  // ---- Handlers ----
  const selectTeam = (code: string) => {
    setSelectedTeamCode(code);
    setSelectedMatchId(null);
    setSelectedKnockoutId(null);
    setAtlasCountry(null);
    setInfoCollapsed(false);
    surfaceMap();
  };

  const selectMatch = (id: string) => {
    setSelectedMatchId(id);
    setSelectedTeamCode(null);
    setSelectedKnockoutId(null);
    setAtlasCountry(null);
    setInfoCollapsed(false);
    surfaceMap();
  };

  // Open any country's Atlas profile on the map.
  const selectAtlasCountry = (code: string) => {
    setAtlasCountry(code);
    setSelectedTeamCode(null);
    setSelectedMatchId(null);
    setSelectedKnockoutId(null);
    setInfoCollapsed(false);
    surfaceMap();
  };

  // Start a comparison from a country (Country of the Week, profile card…).
  const startCompare = (code: string) => {
    setSection("atlas");
    setAtlasTab("compare");
    setCompareA(code);
    setCompareB((b) => (b === code ? null : b));
    setAtlasCountry(null);
    surfacePanel();
  };

  const changeCompare = (a: string | null, b: string | null) => {
    setCompareA(a);
    setCompareB(b);
    setAtlasCountry(null);
  };

  // Map click on any country polygon, routed by context.
  const onCountryClick = (code: string) => {
    if (section === "worldcup") {
      const team = teams.find((t) => t.isoA3Code === code);
      if (team) return selectTeam(team.fifaCode);
    }
    if (!world?.byCode.has(code)) return;
    if (section === "atlas" && atlasTab === "compare") {
      // Fill the empty slot; with both set, the tap replaces the second.
      if (!compareA) changeCompare(code, compareB);
      else if (code !== compareA) {
        changeCompare(compareA, code);
        surfacePanel(); // phones: show the comparison
      }
      return;
    }
    selectAtlasCountry(code);
  };

  const changeSection = (s: Section) => {
    setSection(s);
    setSelectedTeamCode(null);
    setSelectedMatchId(null);
    setSelectedKnockoutId(null);
    setHoveredTeamCode(null);
    setAtlasCountry(null);
  };

  const changeAtlasTab = (t: AtlasTab) => {
    // Opening Compare with a country open: start the comparison from it.
    if (t === "compare" && atlasCountry) {
      if (!compareA) setCompareA(atlasCountry);
      else if (!compareB && compareA !== atlasCountry) setCompareB(atlasCountry);
      setAtlasCountry(null);
    }
    setAtlasTab(t);
  };

  const openDaily = () => {
    changeSection("atlas");
    setAtlasTab("today");
  };

  // Opens the head-to-head comparison once both sides of a knockout fixture
  // are decided; if only one side is known yet, opens that team's profile
  // instead (nothing to compare against). No-op for two TBD placeholders —
  // SchedulePanel doesn't wire a click handler for those anyway.
  const selectKnockout = (k: KnockoutMatch) => {
    if (k.teamA && k.teamB) {
      setSelectedKnockoutId(k.id);
      setSelectedMatchId(null);
      setSelectedTeamCode(null);
      setAtlasCountry(null);
      setInfoCollapsed(false);
      surfaceMap();
    } else if (k.teamA || k.teamB) {
      selectTeam((k.teamA ?? k.teamB)!);
    }
  };

  const clearSelection = () => {
    setSelectedMatchId(null);
    setSelectedTeamCode(null);
    setSelectedKnockoutId(null);
    setAtlasCountry(null);
  };

  // ---- Atlas map marks + camera ----
  const showCompareOnMap = section === "atlas" && atlasTab === "compare";
  const atlasMarks = useMemo(() => {
    const out: { code: string; tone: AtlasTone }[] = [];
    if (showCompareOnMap) {
      if (compareA) out.push({ code: compareA, tone: "a" });
      if (compareB) out.push({ code: compareB, tone: "b" });
    }
    if (atlasCountry) {
      const i = out.findIndex((m) => m.code === atlasCountry);
      if (i >= 0) out.splice(i, 1);
      out.push({ code: atlasCountry, tone: "focus" });
    }
    return out;
  }, [showCompareOnMap, compareA, compareB, atlasCountry]);

  const atlasFrame = useMemo((): AtlasFrame | null => {
    if (!world) return null;
    const codes = atlasCountry
      ? [atlasCountry]
      : showCompareOnMap
      ? [compareA, compareB].filter((c): c is string => Boolean(c))
      : [];
    const boxes = codes
      .map((c) => world.byCode.get(c))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map((c): [number, number, number] => {
        // Box side from the country's area (km → degrees), within sane limits.
        const span = c.area ? Math.sqrt(c.area) / 111 : 3;
        return [c.lat, c.lng, Math.min(45, Math.max(2.5, span * 1.3))];
      });
    return boxes.length ? { key: codes.join(","), boxes } : null;
  }, [world, atlasCountry, showCompareOnMap, compareA, compareB]);

  const countryName = useMemo(
    () =>
      world
        ? (code: string) => {
            const c = world.byCode.get(code);
            return c ? `${c.name} · ${c.nameZh}` : undefined;
          }
        : null,
    [world]
  );

  // ---- Browser Back returns to the initial view instead of leaving ----
  // While anything is open (team/match panel, player modal, easter egg) we
  // keep ONE guard entry on the history stack. Back then pops that entry and
  // we restore the untouched initial view; a second Back leaves the site as
  // usual. Closing things in-app (×) consumes the guard entry silently so the
  // history never accumulates stale states.
  const hasOpenUI = Boolean(
    selectedTeamCode || selectedMatchId || selectedKnockoutId || atlasCountry || selectedPlayer || eggOpen
  );
  const historyArmedRef = useRef(false);
  const suppressPopRef = useRef(false);

  useEffect(() => {
    if (hasOpenUI && !historyArmedRef.current) {
      window.history.pushState({ povatlas: "view" }, "");
      historyArmedRef.current = true;
    } else if (!hasOpenUI && historyArmedRef.current) {
      suppressPopRef.current = true;
      window.history.back();
    }
  }, [hasOpenUI]);

  useEffect(() => {
    const onPop = () => {
      if (suppressPopRef.current) {
        // Our own history.back() after an in-app close — nothing to restore.
        suppressPopRef.current = false;
        historyArmedRef.current = false;
        return;
      }
      if (historyArmedRef.current) {
        // User pressed Back while something was open → initial view.
        historyArmedRef.current = false;
        setSelectedMatchId(null);
        setSelectedTeamCode(null);
        setSelectedKnockoutId(null);
        setAtlasCountry(null);
        setSelectedPlayer(null);
        setEggOpen(false);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ---- Floating info card (bottom-right on desktop, bottom sheet on mobile) ----
  const cardShell =
    "animate-fade-in-up absolute inset-x-0 bottom-0 z-[600] flex h-[72%] flex-col overflow-hidden rounded-t-2xl bg-white shadow-card ring-1 ring-black/5 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:h-[min(34rem,calc(100%-2rem))] sm:w-[min(23rem,calc(100%-1.5rem))] sm:rounded-2xl sm:border sm:border-white/60";

  const atlasSelected = atlasCountry ? world?.byCode.get(atlasCountry) : undefined;
  const hasSelection = Boolean(comparison || selectedTeam || atlasCountry);

  let mapInfoCard;
  if (!hasSelection) {
    mapInfoCard = null;
  } else if (infoCollapsed) {
    mapInfoCard = (
      <CollapsedBar onExpand={() => setInfoCollapsed(false)} onClose={clearSelection}>
        {comparison ? (
          <>
            <Flag team={comparison.teamA} className="h-5 w-7" />
            <span className="text-[11px] font-black text-slate-400">vs</span>
            <Flag team={comparison.teamB} className="h-5 w-7" />
          </>
        ) : selectedTeam ? (
          <>
            <Flag team={selectedTeam} className="h-5 w-7" />
            <span className="truncate">{selectedTeam.teamName}</span>
          </>
        ) : atlasSelected ? (
          <>
            <CountryFlag country={atlasSelected} className="h-5 w-7" />
            <span className="truncate">{atlasSelected.name}</span>
          </>
        ) : null}
      </CollapsedBar>
    );
  } else if (atlasCountry) {
    const wcTeam = teamForAtlasCode(atlasCountry);
    mapInfoCard = (
      <MapInfoSheet key={`atlas-${atlasCountry}`} className={cardShell} onCollapse={() => setInfoCollapsed(true)}>
        <Suspense fallback={<PanelLoading />}>
          <AtlasCountryCard
            code={atlasCountry}
            worldCupTeamName={wcTeam?.teamName}
            onClose={clearSelection}
            onCollapse={() => setInfoCollapsed(true)}
            onShowCountry={selectAtlasCountry}
            onCompare={startCompare}
            onOpenWorldCup={
              wcTeam
                ? () => {
                    changeSection("worldcup");
                    selectTeam(wcTeam.fifaCode);
                  }
                : undefined
            }
          />
        </Suspense>
      </MapInfoSheet>
    );
  } else if (comparison) {
    mapInfoCard = (
      <MapInfoSheet
        key={`cmp-${selectedMatchId ?? selectedKnockoutId}`}
        className={cardShell}
        onCollapse={() => setInfoCollapsed(true)}
      >
        <Suspense fallback={<PanelLoading />}>
          <CountryComparisonCard
            codeA={comparison.codes[0]}
            codeB={comparison.codes[1]}
            result={comparisonResult}
            onMoreStats={() => {
              const a = atlasCodeForTeam(comparison.teamA);
              const b = atlasCodeForTeam(comparison.teamB);
              changeSection("atlas");
              setAtlasTab("compare");
              changeCompare(a, a === b ? null : b);
              surfacePanel();
            }}
            onClose={clearSelection}
            onCollapse={() => setInfoCollapsed(true)}
            onSelectTeam={selectTeam}
            onHoverTeam={setHoveredTeamCode}
          />
        </Suspense>
      </MapInfoSheet>
    );
  } else if (selectedTeam) {
    mapInfoCard = (
      <MapInfoSheet
        key={`team-${selectedTeamCode}`}
        className={cardShell}
        onCollapse={() => setInfoCollapsed(true)}
      >
        <Suspense fallback={<PanelLoading />}>
          <CountryDetailPanel
            team={selectedTeam}
            matches={getMatchesForTeam(selectedTeam.fifaCode, liveMatches)}
            selectedMatchId={selectedMatchId}
            hoveredMatchId={hoveredMatchId}
            onClose={() => setSelectedTeamCode(null)}
            onCollapse={() => setInfoCollapsed(true)}
            onHoverMatch={setHoveredMatchId}
            onSelectMatch={selectMatch}
            onSelectPlayer={(team, player) => setSelectedPlayer({ team, player })}
          />
        </Suspense>
      </MapInfoSheet>
    );
  }

  return (
    <Layout
      focusMapSignal={focusMapSignal}
      focusPanelSignal={focusPanelSignal}
      daily={{
        puzzle,
        done: todayGame.done,
        streak: currentStreak(daily.stats, puzzle),
        onOpen: openDaily,
      }}
      schedule={
        <div className="flex h-full min-h-0 flex-col">
          <SectionSwitch section={section} onChange={changeSection} />
          <div className="flex min-h-0 flex-1 flex-col">
            {section === "atlas" ? (
              <Suspense fallback={<div className="m-3 h-72 animate-pulse rounded-2xl bg-slate-100" />}>
                <AtlasPanel
                  tab={atlasTab}
                  onTabChange={changeAtlasTab}
                  compareA={compareA}
                  compareB={compareB}
                  onCompareChange={changeCompare}
                  selectedCode={atlasCountry}
                  onShowCountry={selectAtlasCountry}
                  onCompare={startCompare}
                />
              </Suspense>
            ) : (
              <SchedulePanel
                matches={filteredMatches}
                allMatches={liveMatches}
                knockout={knockout}
                liveMeta={liveMeta}
                teams={filteredTeams}
                hoveredTeamCode={hoveredTeamCode}
                selectedTeamCode={selectedTeamCode}
                hoveredMatchId={hoveredMatchId}
                selectedMatchId={selectedMatchId}
                hoveredKnockoutId={hoveredKnockoutId}
                selectedKnockoutId={selectedKnockoutId}
                onHoverTeam={setHoveredTeamCode}
                onSelectTeam={selectTeam}
                onHoverMatch={setHoveredMatchId}
                onSelectMatch={selectMatch}
                onHoverKnockout={setHoveredKnockoutId}
                onSelectKnockout={selectKnockout}
                onSelectPlayer={(team, player) => setSelectedPlayer({ team, player })}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            )}
          </div>
        </div>
      }
      map={
        <div className="relative h-full w-full">
          <WorldMap
            mode={section}
            atlasMarks={atlasMarks}
            atlasFrame={atlasFrame}
            countryName={countryName}
            onCountryClick={onCountryClick}
            cardOpen={hasSelection && !infoCollapsed}
            teams={teams}
            highlightCodes={highlightCodes}
            focusCode={focusCode}
            fitCodes={fitCodes}
            venue={matchVenue}
            onTeamClick={selectTeam}
            onTeamHover={setHoveredTeamCode}
            onEasterEgg={() => setEggOpen(true)}
          />
          {mapInfoCard}
        </div>
      }
      overlay={
        <>
          <Suspense fallback={null}>
            {eggOpen && <EasterEggModal open onClose={() => setEggOpen(false)} />}
            {selectedPlayer && (
              <PlayerModal
                team={selectedPlayer.team}
                player={selectedPlayer.player}
                onClose={() => setSelectedPlayer(null)}
                onViewCountry={selectTeam}
              />
            )}
          </Suspense>
        </>
      }
    />
  );
}

/**
 * Wraps the floating info card. On mobile (the bottom-sheet layout) it shows a
 * full-width grab handle at the top. Drag it down to minimise, or release
 * before the threshold to snap back with a spring animation.
 *
 * Uses direct DOM manipulation (no React state during drag) so the card
 * follows the finger at 60 fps without triggering re-renders.
 */
function MapInfoSheet({
  className,
  onCollapse,
  children,
}: {
  className: string;
  onCollapse: () => void;
  children: ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const currentY = useRef(0);
  const THRESHOLD = 100;

  const applyTransform = (y: number, animate: boolean) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = animate
      ? "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
      : "none";
    el.style.transform = y > 0 ? `translateY(${y}px)` : "";
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startY.current = e.clientY;
    isDragging.current = true;
    currentY.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dy = Math.max(0, e.clientY - startY.current);
    currentY.current = dy;
    applyTransform(dy, false);
  };

  const endDrag = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (currentY.current > THRESHOLD) {
      applyTransform(0, false);
      onCollapse();
    } else {
      applyTransform(0, true); // spring back
    }
  };

  return (
    <div ref={sheetRef} className={className}>
      {/* Centred grab handle — only visible on mobile (sm:hidden). Kept narrow
          and centred so it never covers the header's collapse/close buttons
          (top-right) or the flag (top-left), which a full-width strip did. */}
      <div
        className="absolute left-1/2 top-0 z-20 flex h-9 w-28 -translate-x-1/2 cursor-grab touch-none items-start justify-center pt-2.5 active:cursor-grabbing sm:hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label="Drag down to minimise"
        role="button"
      >
        <span className="h-1 w-10 rounded-full bg-slate-300" />
      </div>
      {children}
    </div>
  );
}

/** Brief placeholder while a lazily loaded info panel downloads. */
function PanelLoading() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      <span className="ball-spin mr-2 inline-block" aria-hidden>
        🌍
      </span>
      Loading…
    </div>
  );
}

/** Collapsed state of the info card: a small pill you can re-expand. */
function CollapsedBar({
  children,
  onExpand,
  onClose,
}: {
  /** Flag(s) + label describing what's collapsed. */
  children: ReactNode;
  onExpand: () => void;
  onClose: () => void;
}) {
  return (
    <div className="animate-fade-in-up absolute bottom-4 right-4 z-[600] flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-white/60 bg-white/95 py-1.5 pl-2.5 pr-1.5 shadow-card ring-1 ring-black/5 backdrop-blur">
      <button
        type="button"
        onClick={onExpand}
        className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-slate-700"
        title="Expand"
      >
        {children}
      </button>
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand card"
        className="rounded-full bg-brand-blue/10 px-2 py-1 text-xs font-bold text-brand-blue transition hover:bg-brand-blue/20"
      >
        ⤢
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-200"
      >
        ✕
      </button>
    </div>
  );
}
