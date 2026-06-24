import { useMemo } from "react";
import { getAllStarPlayers } from "../utils/dataHelpers";
import Flag from "./Flag";

interface PlayersViewProps {
  searchTerm: string;
  selectedTeamCode: string | null;
  hoveredTeamCode: string | null;
  onSelectTeam: (code: string) => void;
  onHoverTeam: (code: string | null) => void;
}

/** Searchable list of every team's star players. */
export default function PlayersView({
  searchTerm,
  selectedTeamCode,
  hoveredTeamCode,
  onSelectTeam,
  onHoverTeam,
}: PlayersViewProps) {
  const all = useMemo(() => getAllStarPlayers(), []);
  const term = searchTerm.trim().toLowerCase();

  const list = useMemo(() => {
    if (!term) return all;
    return all.filter(({ team, player }) =>
      [
        player.name,
        player.position,
        team.teamName,
        team.nameZh,
        team.fifaCode,
      ]
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
        {list.length} star player{list.length === 1 ? "" : "s"} · tap to open the
        country
      </p>
      {list.map(({ team, player }) => {
        const selected = selectedTeamCode === team.fifaCode;
        const hovered = hoveredTeamCode === team.fifaCode;
        return (
          <button
            key={`${team.fifaCode}-${player.name}`}
            type="button"
            onMouseEnter={() => onHoverTeam(team.fifaCode)}
            onMouseLeave={() => onHoverTeam(null)}
            onClick={() => onSelectTeam(team.fifaCode)}
            className={[
              "flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition",
              selected
                ? "border-brand-blue bg-brand-blue/5 ring-1 ring-brand-blue"
                : hovered
                ? "border-brand-sky bg-brand-sky/5"
                : "border-slate-200 bg-white hover:border-brand-sky/60 hover:bg-slate-50",
            ].join(" ")}
          >
            <Flag team={team} className="mt-0.5 h-6 w-8" />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-1.5">
                <span className="truncate text-sm font-semibold text-slate-700">
                  {player.name}
                </span>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {player.position}
                </span>
              </span>
              <span className="block text-[11px] text-slate-400">
                {team.teamName} · {team.nameZh}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                {player.note}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
