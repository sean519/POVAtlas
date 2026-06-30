import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, KnockoutMatch, Match, StarPlayer, Team } from "../types";
import MatchCard from "./MatchCard";
import TeamBadge from "./TeamBadge";
import StandingsView from "./StandingsView";
import StatsView from "./StatsView";
import PlayersView from "./PlayersView";
import Flag from "./Flag";
import WinChanceBar from "./WinChanceBar";
import { ALL_GROUPS, getTeamByCode, matchWinChance } from "../utils/dataHelpers";
import { ROUND_META } from "../utils/knockout";
import { groupColors } from "../utils/groupColors";
import {
  formatKickoff,
  formatLongDate,
  formatShortDate,
  todayInKickoffTz,
} from "../utils/formatters";

type Tab = "matches" | "teams" | "standings" | "stats" | "players";

/** One row in the chronological schedule: a group match or a knockout match. */
type DayItem =
  | { kind: "group"; match: Match }
  | { kind: "ko"; ko: KnockoutMatch };

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
  /** Knockout bracket (auto-filled from Wikipedia); empty until it exists. */
  knockout: KnockoutMatch[];
  /** Live-feed status line ("Last updated …"); null until the first fetch. */
  liveMeta: { updatedAt: string; source: string; stale: boolean } | null;
  teams: Team[];
  hoveredTeamCode: string | null;
  selectedTeamCode: string | null;
  hoveredMatchId: string | null;
  selectedMatchId: string | null;
  /** Selected/hovered knockout fixture id, mirroring hoveredMatchId/selectedMatchId. */
  hoveredKnockoutId: string | null;
  selectedKnockoutId: string | null;
  onHoverTeam: (code: string | null) => void;
  onSelectTeam: (code: string) => void;
  onHoverMatch: (id: string | null) => void;
  onSelectMatch: (id: string) => void;
  onHoverKnockout: (id: string | null) => void;
  /** Opens the head-to-head comparison (both teams known) or that team's
   * profile (only one team decided yet). No-op if neither team is decided. */
  onSelectKnockout: (k: KnockoutMatch) => void;
  onSelectPlayer: (team: Team, player: StarPlayer) => void;
  searchTerm: string;
  onSearchChange: (v: string) => void;
}

/** Local clock label (HH:MM:SS) for the "Last updated" line. */
function formatClock(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
}

export default function SchedulePanel({
  matches,
  allMatches,
  knockout,
  liveMeta,
  teams,
  hoveredTeamCode,
  selectedTeamCode,
  hoveredMatchId,
  selectedMatchId,
  hoveredKnockoutId,
  selectedKnockoutId,
  onHoverTeam,
  onSelectTeam,
  onHoverMatch,
  onSelectMatch,
  onHoverKnockout,
  onSelectKnockout,
  onSelectPlayer,
  searchTerm,
  onSearchChange,
}: SchedulePanelProps) {
  const [tab, setTab] = useState<Tab>("matches");
  const today = todayInKickoffTz();

  // Whole schedule (group + knockout) in chronological order, grouped by date.
  // Knockout matches are folded in by date so "today" highlights/auto-scrolls to
  // them once the group stage is over. Hidden while searching (group only).
  const scheduleByDate = useMemo(() => {
    const map = new Map<string, DayItem[]>();
    const add = (date: string, item: DayItem) => {
      const list = map.get(date) ?? [];
      list.push(item);
      map.set(date, list);
    };
    for (const m of matches) add(m.date, { kind: "group", match: m });
    if (!searchTerm.trim()) {
      for (const k of knockout) if (k.date) add(k.date, { kind: "ko", ko: k });
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [matches, knockout, searchTerm]);

  // The date section to auto-scroll to: today, or the next upcoming date.
  const anchorDate = useMemo(() => {
    const dates = scheduleByDate.map(([d]) => d);
    if (dates.includes(today)) return today;
    return dates.find((d) => d >= today) ?? dates[dates.length - 1] ?? null;
  }, [scheduleByDate, today]);

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
        {tab === "matches" && liveMeta && (
          <p className="mb-2 text-center text-[10px] text-slate-400">
            Last updated: {formatClock(liveMeta.updatedAt)}
            {liveMeta.stale && " · showing last cached"}
          </p>
        )}
        {tab === "matches" &&
          (scheduleByDate.length === 0 ? (
            <EmptyState label="No matches match your search." />
          ) : (
            <div className="space-y-5">
              {scheduleByDate.map(([date, items]) => {
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
                      {items.map((it) =>
                        it.kind === "group" ? (
                          <MatchCard
                            key={it.match.matchId}
                            match={it.match}
                            selected={selectedMatchId === it.match.matchId}
                            hovered={hoveredMatchId === it.match.matchId}
                            onHover={onHoverMatch}
                            onClick={onSelectMatch}
                          />
                        ) : (
                          <KnockoutCard
                            key={it.ko.id}
                            k={it.ko}
                            today={today}
                            selected={selectedKnockoutId === it.ko.id}
                            hovered={hoveredKnockoutId === it.ko.id}
                            onHover={onHoverKnockout}
                            onClick={onSelectKnockout}
                          />
                        )
                      )}
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

const KO_STATUS_STYLES = {
  scheduled: { label: "Upcoming", className: "bg-slate-100 text-slate-600" },
  finished: { label: "Full time", className: "bg-emerald-100 text-emerald-700" },
} as const;

/** Status pill content for a knockout fixture (no live-minute tracking yet). */
function knockoutStatus(
  played: boolean,
  date: string,
  today: string
): { label: string; className: string } {
  if (played) return KO_STATUS_STYLES.finished;
  if (date === today) return { ...KO_STATUS_STYLES.scheduled, label: "Today" };
  return KO_STATUS_STYLES.scheduled;
}

/**
 * One knockout fixture, styled to match a group-stage `MatchCard` (round
 * badge instead of group badge, same date/time/status row, score, venue and
 * win-chance bar). Tapping the card opens the head-to-head comparison (once
 * both teams are decided) — same as a group match — or that team's profile if
 * only one side is decided yet. Cards with two TBD placeholders aren't
 * interactive (nothing to show).
 */
function KnockoutCard({
  k,
  today,
  selected,
  hovered,
  onHover,
  onClick,
}: {
  k: KnockoutMatch;
  today: string;
  selected: boolean;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (k: KnockoutMatch) => void;
}) {
  const played = k.scoreA !== null && k.scoreB !== null;
  const clickable = Boolean(k.teamA || k.teamB);
  const status = knockoutStatus(played, k.date, today);
  const teamA = k.teamA ? getTeamByCode(k.teamA) : undefined;
  const teamB = k.teamB ? getTeamByCode(k.teamB) : undefined;
  const chance =
    k.teamA && k.teamB ? matchWinChance(k.teamA, k.teamB) : null;

  return (
    <button
      type="button"
      disabled={!clickable}
      onMouseEnter={() => clickable && onHover(k.id)}
      onMouseLeave={() => clickable && onHover(null)}
      onFocus={() => clickable && onHover(k.id)}
      onBlur={() => clickable && onHover(null)}
      onClick={() => clickable && onClick(k)}
      className={[
        "w-full rounded-xl border p-3 text-left transition",
        !clickable
          ? "cursor-default border-amber-100 bg-amber-50/20 opacity-80"
          : selected
          ? "border-brand-blue bg-brand-blue/5 shadow-card ring-1 ring-brand-blue"
          : hovered
          ? "border-amber-300 bg-amber-50/70"
          : "border-amber-200 bg-amber-50/40 hover:border-amber-300 hover:bg-amber-50/70",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 font-bold text-amber-700">
          🏆 {ROUND_META[k.round].label}
        </span>
        <span className="text-slate-500">
          {formatShortDate(k.date)}
          {k.kickoffTime ? ` · ${formatKickoff(k.kickoffTime)}` : ""}
        </span>
        <span className={`rounded-md px-1.5 py-0.5 font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <KnockoutSide team={teamA} label={k.labelA} />
        <div className="px-1 text-center">
          {played ? (
            <span className="rounded-lg bg-brand-navy px-2 py-0.5 text-sm font-bold text-white">
              {k.scoreA} – {k.scoreB}
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-400">vs</span>
          )}
        </div>
        <KnockoutSide team={teamB} label={k.labelB} alignEnd />
      </div>

      {(k.venue || k.city) && (
        <div className="mt-2 truncate text-center text-[11px] text-slate-400">
          {[k.venue, k.city].filter(Boolean).join(" · ")}
        </div>
      )}

      {chance && teamA && teamB && (
        <WinChanceBar chance={chance} teamA={teamA} teamB={teamB} variant="compact" />
      )}
    </button>
  );
}

function KnockoutSide({
  team,
  label,
  alignEnd,
}: {
  team: import("../types").Team | undefined;
  label: string;
  alignEnd?: boolean;
}) {
  if (!team) {
    return (
      <div
        className={`flex min-w-0 items-center gap-2 ${
          alignEnd ? "justify-self-end text-right" : "justify-self-start"
        }`}
      >
        <span className="truncate text-xs italic text-slate-400">{label}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${
        alignEnd ? "justify-self-end text-right" : "justify-self-start"
      }`}
    >
      {alignEnd ? (
        <>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold">{team.teamName}</span>
            <span className="block truncate text-[11px] text-slate-400">{team.nameZh}</span>
          </span>
          <Flag team={team} className="h-6 w-8 shrink-0" />
        </>
      ) : (
        <>
          <Flag team={team} className="h-6 w-8 shrink-0" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold">{team.teamName}</span>
            <span className="block truncate text-[11px] text-slate-400">{team.nameZh}</span>
          </span>
        </>
      )}
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
