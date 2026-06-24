import type { Match } from "../types";
import { getTeamByCode, matchWinChance } from "../utils/dataHelpers";
import { groupColors } from "../utils/groupColors";
import { formatKickoff, formatShortDate } from "../utils/formatters";
import Flag from "./Flag";
import WinChanceBar from "./WinChanceBar";

interface MatchCardProps {
  match: Match;
  selected?: boolean;
  hovered?: boolean;
  onHover?: (matchId: string | null) => void;
  onClick?: (matchId: string) => void;
}

const statusStyles: Record<Match["status"], { label: string; className: string }> = {
  scheduled: {
    label: "Upcoming",
    className: "bg-slate-100 text-slate-600",
  },
  live: {
    label: "● Live",
    className: "bg-red-100 text-red-700 animate-pulse",
  },
  finished: {
    label: "Full time",
    className: "bg-emerald-100 text-emerald-700",
  },
};

/**
 * A single match row: both teams, group, kickoff, venue, score and status.
 */
export default function MatchCard({
  match,
  selected = false,
  hovered = false,
  onHover,
  onClick,
}: MatchCardProps) {
  const teamA = getTeamByCode(match.teamA);
  const teamB = getTeamByCode(match.teamB);
  if (!teamA || !teamB) return null;

  const group = groupColors[match.group];
  const status = statusStyles[match.status];
  const hasScore = match.scoreA !== null && match.scoreB !== null;
  const chance = matchWinChance(match.teamA, match.teamB);

  return (
    <button
      type="button"
      onMouseEnter={() => onHover?.(match.matchId)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(match.matchId)}
      onBlur={() => onHover?.(null)}
      onClick={() => onClick?.(match.matchId)}
      className={[
        "w-full rounded-xl border p-3 text-left transition",
        selected
          ? "border-brand-blue bg-brand-blue/5 shadow-card ring-1 ring-brand-blue"
          : hovered
          ? "border-brand-sky bg-brand-sky/5"
          : "border-slate-200 bg-white hover:border-brand-sky/60 hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
        <span
          className={`rounded-md px-1.5 py-0.5 font-bold ${group.bg} ${group.text}`}
        >
          Group {match.group}
        </span>
        <span className="text-slate-500">
          {formatShortDate(match.date)} · {formatKickoff(match.kickoffTime)}
        </span>
        <span className={`rounded-md px-1.5 py-0.5 font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2 justify-self-start">
          <Flag team={teamA} className="h-6 w-8" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold">
              {teamA.teamName}
            </span>
            <span className="block truncate text-[11px] text-slate-400">
              {teamA.nameZh}
            </span>
          </span>
        </div>

        <div className="px-1 text-center">
          {hasScore ? (
            <span className="rounded-lg bg-brand-navy px-2 py-0.5 text-sm font-bold text-white">
              {match.scoreA} – {match.scoreB}
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-400">vs</span>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-2 justify-self-end text-right">
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold">
              {teamB.teamName}
            </span>
            <span className="block truncate text-[11px] text-slate-400">
              {teamB.nameZh}
            </span>
          </span>
          <Flag team={teamB} className="h-6 w-8" />
        </div>
      </div>

      <div className="mt-2 truncate text-center text-[11px] text-slate-400">
        {match.venue} · {match.city}
      </div>

      {chance && (
        <WinChanceBar
          chance={chance}
          teamA={teamA}
          teamB={teamB}
          variant="compact"
        />
      )}
    </button>
  );
}
