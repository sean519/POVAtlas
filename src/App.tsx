import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import Layout from "./components/Layout";
import SchedulePanel from "./components/SchedulePanel";
import WorldMap from "./components/WorldMap";
import CountryDetailPanel from "./components/CountryDetailPanel";
import CountryComparisonCard from "./components/CountryComparisonCard";
import EasterEggModal from "./components/EasterEggModal";
import PlayerModal from "./components/PlayerModal";
import Flag from "./components/Flag";
import type { StarPlayer, Team } from "./types";
import { teams } from "./data/teams";
import { matches } from "./data/matches";
import {
  compareCountries,
  getFactsForTeam,
  getMatchesForTeam,
  getTeamByCode,
} from "./utils/dataHelpers";

export default function App() {
  // ---- Selection / hover state ----
  const [hoveredTeamCode, setHoveredTeamCode] = useState<string | null>(null);
  const [selectedTeamCode, setSelectedTeamCode] = useState<string | null>(null);
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
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
    if (!term) return matches;
    return matches.filter((m) => {
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
  }, [term]);

  // ---- Selection objects ----
  const selectedTeam = getTeamByCode(selectedTeamCode);
  const selectedMatch = selectedMatchId
    ? matches.find((m) => m.matchId === selectedMatchId) ?? null
    : null;
  const comparison = selectedMatch
    ? compareCountries(selectedMatch.teamA, selectedMatch.teamB)
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
    return Array.from(set);
  }, [selectedTeamCode, hoveredTeamCode, selectedMatch, hoveredMatchId]);

  const focusCode = selectedTeamCode;
  // When a match is selected, frame + connect both of its teams on the map.
  const fitCodes = selectedMatch
    ? [selectedMatch.teamA, selectedMatch.teamB]
    : null;

  // ---- Handlers ----
  const selectTeam = (code: string) => {
    setSelectedTeamCode(code);
    setSelectedMatchId(null);
    setInfoCollapsed(false);
    surfaceMap();
  };

  const selectMatch = (id: string) => {
    setSelectedMatchId(id);
    setSelectedTeamCode(null);
    setInfoCollapsed(false);
    surfaceMap();
  };

  const clearSelection = () => {
    setSelectedMatchId(null);
    setSelectedTeamCode(null);
  };

  // ---- Floating info card (bottom-right on desktop, bottom sheet on mobile) ----
  const cardShell =
    "animate-fade-in-up absolute inset-x-0 bottom-0 z-[600] flex h-[72%] flex-col overflow-hidden rounded-t-2xl bg-white shadow-card ring-1 ring-black/5 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:h-[min(34rem,calc(100%-2rem))] sm:w-[min(23rem,calc(100%-1.5rem))] sm:rounded-2xl sm:border sm:border-white/60";

  const hasSelection = Boolean(comparison || selectedTeam);

  let mapInfoCard;
  if (!hasSelection) {
    mapInfoCard = <WelcomeHint />;
  } else if (infoCollapsed) {
    mapInfoCard = (
      <CollapsedBar
        teamA={comparison ? comparison.teamA : selectedTeam ?? null}
        teamB={comparison ? comparison.teamB : null}
        onExpand={() => setInfoCollapsed(false)}
        onClose={clearSelection}
      />
    );
  } else if (comparison) {
    mapInfoCard = (
      <MapInfoSheet
        key={`cmp-${selectedMatchId}`}
        className={cardShell}
        onCollapse={() => setInfoCollapsed(true)}
      >
        <CountryComparisonCard
          comparison={comparison}
          onClose={() => setSelectedMatchId(null)}
          onCollapse={() => setInfoCollapsed(true)}
          onSelectTeam={selectTeam}
          onHoverTeam={setHoveredTeamCode}
        />
      </MapInfoSheet>
    );
  } else if (selectedTeam) {
    mapInfoCard = (
      <MapInfoSheet
        key={`team-${selectedTeamCode}`}
        className={cardShell}
        onCollapse={() => setInfoCollapsed(true)}
      >
        <CountryDetailPanel
          team={selectedTeam}
          facts={getFactsForTeam(selectedTeam.fifaCode)}
          matches={getMatchesForTeam(selectedTeam.fifaCode)}
          selectedMatchId={selectedMatchId}
          hoveredMatchId={hoveredMatchId}
          onClose={() => setSelectedTeamCode(null)}
          onCollapse={() => setInfoCollapsed(true)}
          onHoverMatch={setHoveredMatchId}
          onSelectMatch={selectMatch}
        />
      </MapInfoSheet>
    );
  }

  return (
    <Layout
      focusMapSignal={focusMapSignal}
      schedule={
        <SchedulePanel
          matches={filteredMatches}
          teams={filteredTeams}
          hoveredTeamCode={hoveredTeamCode}
          selectedTeamCode={selectedTeamCode}
          hoveredMatchId={hoveredMatchId}
          selectedMatchId={selectedMatchId}
          onHoverTeam={setHoveredTeamCode}
          onSelectTeam={selectTeam}
          onHoverMatch={setHoveredMatchId}
          onSelectMatch={selectMatch}
          onSelectPlayer={(team, player) => setSelectedPlayer({ team, player })}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      }
      map={
        <div className="relative h-full w-full">
          <WorldMap
            teams={teams}
            highlightCodes={highlightCodes}
            focusCode={focusCode}
            fitCodes={fitCodes}
            onTeamClick={selectTeam}
            onTeamHover={setHoveredTeamCode}
            onEasterEgg={() => setEggOpen(true)}
          />
          {mapInfoCard}
        </div>
      }
      overlay={
        <>
          <EasterEggModal open={eggOpen} onClose={() => setEggOpen(false)} />
          <PlayerModal
            team={selectedPlayer?.team ?? null}
            player={selectedPlayer?.player ?? null}
            onClose={() => setSelectedPlayer(null)}
            onViewCountry={selectTeam}
          />
        </>
      }
    />
  );
}

/** Compact hint shown in the map corner when nothing is selected. */
function WelcomeHint() {
  return (
    <div className="animate-fade-in-up absolute bottom-4 right-4 z-[600] w-[min(20rem,calc(100%-1.5rem))] rounded-2xl border border-white/60 bg-white/95 p-4 shadow-card ring-1 ring-black/5 backdrop-blur">
      <h2 className="text-sm font-extrabold text-brand-navy">
        👋 Tap a team or a match
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        Click a team for its country profile &amp; star players, or click a
        match to compare both countries — the details appear right here.
      </p>
    </div>
  );
}

/**
 * Wraps the floating info card. On mobile (the bottom-sheet layout) it shows a
 * grab handle at the top: drag it down to minimise the card to a pill. On
 * desktop the handle is hidden and the wrapper is a plain container.
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
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  // Pull down past this many pixels (or a quick flick) to minimise.
  const THRESHOLD = 90;

  const isMobile = () =>
    typeof window !== "undefined" && window.innerWidth < 640;

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!isMobile()) return;
    startY.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragging) return;
    // Only allow dragging downward.
    setDragY(Math.max(0, e.clientY - startY.current));
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragY > THRESHOLD) {
      setDragY(0);
      onCollapse();
    } else {
      setDragY(0); // snap back
    }
  };

  return (
    <div
      className={className}
      style={
        dragY
          ? {
              transform: `translateY(${dragY}px)`,
              transition: dragging ? "none" : "transform 0.2s ease",
            }
          : undefined
      }
    >
      {/* Mobile-only drag handle (centred so it never overlaps header buttons) */}
      <div
        className="absolute left-1/2 top-0 z-20 flex h-7 w-28 -translate-x-1/2 cursor-grab touch-none items-start justify-center pt-2 active:cursor-grabbing sm:hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label="Drag down to minimise"
        role="button"
      >
        <span className="h-1.5 w-10 rounded-full bg-white/60" />
      </div>
      {children}
    </div>
  );
}

/** Collapsed state of the info card: a small pill you can re-expand. */
function CollapsedBar({
  teamA,
  teamB,
  onExpand,
  onClose,
}: {
  teamA: import("./types").Team | null;
  teamB: import("./types").Team | null;
  onExpand: () => void;
  onClose: () => void;
}) {
  if (!teamA) return null;
  return (
    <div className="animate-fade-in-up absolute bottom-4 right-4 z-[600] flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-white/60 bg-white/95 py-1.5 pl-2.5 pr-1.5 shadow-card ring-1 ring-black/5 backdrop-blur">
      <button
        type="button"
        onClick={onExpand}
        className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-slate-700"
        title="Expand"
      >
        <Flag team={teamA} className="h-5 w-7" />
        {teamB ? (
          <>
            <span className="text-[11px] font-black text-slate-400">vs</span>
            <Flag team={teamB} className="h-5 w-7" />
          </>
        ) : (
          <span className="truncate">{teamA.teamName}</span>
        )}
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
