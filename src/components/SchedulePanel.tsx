import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, Match, StarPlayer, Team } from "../types";
import MatchCard from "./MatchCard";
import TeamBadge from "./TeamBadge";
import StandingsView from "./StandingsView";
import StatsView from "./StatsView";
import PlayersView from "./PlayersView";
import { ALL_GROUPS } from "../utils/dataHelpers";
import { groupColors } from "../utils/groupColors";
import { formatLongDate, todayInKickoffTz } from "../utils/formatters";

type Tab = "matches" | "teams" | "standings" | "stats" | "players";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "matches", label: "Matches", icon: "📅" },
  { id: "teams", label: "Teams", icon: "👕" },
  { id: "standings", label: "Standings", icon: "🏆" },
  { id: "stats", label: "Stats", icon: "📊" },
  { id: "players", label: "Players", icon: "⭐" },
];

interface SchedulePanelProps {
  matches: Match[];
  /** Full (unfiltered) match list with live scores — for standings/stats. */
  allMatches: Match[];
  teams: Team[];
  hoveredTeamCode: string | null;
  selectedTeamCode: string | null;
  hoveredMatchId: string | null;
  selectedMatchId: string | null;
  onHoverTeam: (code: string | null) => void;
  onSelectTeam: (code: string) => void;
  onHoverMatch: (id: string | null) => void;
  onSelectMatch: (id: string) => void;
  onSelectPlayer: (team: Team, player: StarPlayer) => void;
  searchTerm: string;
  onSearchChange: (v: string) => void;
}

export default function SchedulePanel({
  matches,
  allMatches,
  teams,
  hoveredTeamCode,
  selectedTeamCode,
  hoveredMatchId,
  selectedMatchId,
  onHoverTeam,
  onSelectTeam,
  onHoverMatch,
  onSelectMatch,
  onSelectPlayer,
  searchTerm,
  onSearchChange,
}: SchedulePanelProps) {
  const [tab, setTab] = useState<Tab>("matches");
  const today = todayInKickoffTz();

  // Whole schedule in chronological order, grouped by date (today included).
  const matchesByDate = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of matches) {
      const list = map.get(m.date) ?? [];
      list.push(m);
      map.set(m.date, list);
    }
    return Array.from(map.entries());
  }, [matches]);

  // The date section to auto-scroll to: today, or the next upcoming date.
  const anchorDate = useMemo(() => {
    const dates = matchesByDate.map(([d]) => d);
    if (dates.includes(today)) return today;
    return dates.find((d) => d >= today) ?? dates[dates.length - 1] ?? null;
  }, [matchesByDate, today]);

  const anchorRef = useRef<HTMLDivElement>(null);

  // When the Matches tab opens, jump to the current/upcoming date.
  useEffect(() => {
    if (tab !== "matches") return;
    const el = anchorRef.current;
    if (el) el.scrollIntoView({ block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, anchorDate]);

  const teamsByGroup = useMemo(() => {
    const map = new Map<Group, Team[]>();
    for (const t of teams) {
      const list = map.get(t.group) ?? [];
      list.push(t);
      map.set(t.group, list);
    }
    return ALL_GROUPS.filter((g) => map.has(g)).map(
      (g) => [g, map.get(g)!] as const
    );
  }, [teams]);

  return (
    <div className="flex h-full flex-col">
      {/* Search only */}
      <div className="border-b border-slate-200 bg-white p-3">
        <div className="relative">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden
          >
            🔎
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search country, team, code, player…"
            aria-label="Search"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/40"
          />
        </div>
      </div>

      {/* Tabs — equal-width grid, no horizontal scrolling */}
      <div className="grid grid-cols-5 gap-1 border-b border-slate-200 bg-slate-50 px-1.5 py-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            title={t.label}
            className={[
              "flex flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[10px] font-bold leading-none transition",
              tab === t.id
                ? "bg-white text-brand-blue shadow ring-1 ring-brand-sky/40"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
            ].join(" ")}
          >
            <span className="text-sm" aria-hidden>
              {t.icon}
            </span>
            <span className="w-full truncate text-center">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="nice-scroll flex-1 overflow-y-auto p-3">
        {tab === "matches" &&
          (matchesByDate.length === 0 ? (
            <EmptyState label="No matches match your search." />
          ) : (
            <div className="space-y-5">
              {matchesByDate.map(([date, dayMatches]) => {
                const isToday = date === today;
                const isAnchor = date === anchorDate;
                return (
                  <section key={date} ref={isAnchor ? anchorRef : undefined}>
                    <h3
                      className={[
                        "sticky top-0 z-10 mb-2 flex items-center gap-2 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur",
                        isToday
                          ? "rounded-lg bg-brand-peach/15 px-2 py-1.5 font-extrabold text-brand-peach"
                          : "bg-white/90 text-brand-blue",
                      ].join(" ")}
                    >
                      {isToday && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-peach opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-peach" />
                        </span>
                      )}
                      {isToday ? "Today · " : ""}
                      {formatLongDate(date)}
                    </h3>
                    <div className="space-y-2">
                      {dayMatches.map((m) => (
                        <MatchCard
                          key={m.matchId}
                          match={m}
                          selected={selectedMatchId === m.matchId}
                          hovered={hoveredMatchId === m.matchId}
                          onHover={onHoverMatch}
                          onClick={onSelectMatch}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ))}

        {tab === "teams" &&
          (teamsByGroup.length === 0 ? (
            <EmptyState label="No teams match your search." />
          ) : (
            <div className="space-y-4">
              {teamsByGroup.map(([group, groupTeams]) => {
                const c = groupColors[group];
                return (
                  <section key={group}>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <span className={`rounded-md px-1.5 py-0.5 ${c.bg} ${c.text}`}>
                        Group {group}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {groupTeams.map((t) => (
                        <TeamBadge
                          key={t.fifaCode}
                          team={t}
                          selected={selectedTeamCode === t.fifaCode}
                          hovered={hoveredTeamCode === t.fifaCode}
                          onHover={onHoverTeam}
                          onClick={onSelectTeam}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ))}

        {tab === "standings" && (
          <StandingsView
            matches={allMatches}
            selectedTeamCode={selectedTeamCode}
            hoveredTeamCode={hoveredTeamCode}
            onSelectTeam={onSelectTeam}
            onHoverTeam={onHoverTeam}
          />
        )}

        {tab === "stats" && (
          <StatsView
            matches={allMatches}
            onSelectTeam={onSelectTeam}
            onSelectMatch={onSelectMatch}
            onHoverTeam={onHoverTeam}
          />
        )}

        {tab === "players" && (
          <PlayersView
            searchTerm={searchTerm}
            hoveredTeamCode={hoveredTeamCode}
            onSelectPlayer={onSelectPlayer}
            onHoverTeam={onHoverTeam}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-slate-400">
      <span className="text-3xl" aria-hidden>
        🌍
      </span>
      <p className="text-sm">{label}</p>
    </div>
  );
}
