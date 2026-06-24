import { useMemo } from "react";
import type { StarPlayer, Team } from "../types";
import { getAllStarPlayers } from "../utils/dataHelpers";
import Flag from "./Flag";

interface PlayersViewProps {
  searchTerm: string;
  hoveredTeamCode: string | null;
  onSelectPlayer: (team: Team, player: StarPlayer) => void;
  onHoverTeam: (code: string | null) => void;
}

/** Star players ranked by fame; tap one to open their profile. */
export default function PlayersView({
  searchTerm,
  hoveredTeamCode,
  onSelectPlayer,
  onHoverTeam,
}: PlayersViewProps) {
  const term = searchTerm.trim().toLowerCase();

  // Ranked by fame (most famous first).
  const all = useMemo(
    () => getAllStarPlayers().sort((a, b) => b.player.fame - a.player.fame),
    []
  );

  const list = useMemo(() => {
    if (!term) return all;
    return all.filter(({ team, player }) =>
      [player.name, player.position, team.teamName, team.nameZh, team.fifaCode]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [all, term]);

  if (list.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        No players match your search.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-400">
        Ranked by fame · tap a player for their profile
      </p>
      {list.map(({ team, player }, i) => {
        const hovered = hoveredTeamCode === team.fifaCode;
        return (
          <button
            key={`${team.fifaCode}-${player.name}`}
            type="button"
            onMouseEnter={() => onHoverTeam(team.fifaCode)}
            onMouseLeave={() => onHoverTeam(null)}
            onClick={() => onSelectPlayer(team, player)}
            className={[
              "flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition",
              hovered
                ? "border-brand-sky bg-brand-sky/5"
                : "border-slate-200 bg-white hover:border-brand-sky/60 hover:bg-slate-50",
            ].join(" ")}
          >
            <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">
              {i + 1}
            </span>
            <Flag team={team} className="h-6 w-8" />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-1.5">
                <span className="truncate text-sm font-semibold text-slate-700">
                  {player.name}
                </span>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {player.position}
                </span>
              </span>
              <span className="block truncate text-[11px] text-slate-400">
                {team.teamName} · {team.nameZh}
              </span>
            </span>
            <span className="shrink-0 rounded-md bg-brand-gold/20 px-1.5 py-0.5 text-[11px] font-bold text-amber-600">
              ⭐ {player.fame}
            </span>
          </button>
        );
      })}
    </div>
  );
}
