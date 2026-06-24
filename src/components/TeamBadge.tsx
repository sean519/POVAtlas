import type { Team } from "../types";
import { groupColors } from "../utils/groupColors";
import Flag from "./Flag";

interface TeamBadgeProps {
  team: Team;
  selected?: boolean;
  hovered?: boolean;
  showGroup?: boolean;
  showCode?: boolean;
  onHover?: (code: string | null) => void;
  onClick?: (code: string) => void;
}

/**
 * A compact, clickable team chip: flag + name (+ optional FIFA code / group).
 * Reused in the schedule, detail panel and comparison card.
 */
export default function TeamBadge({
  team,
  selected = false,
  hovered = false,
  showGroup = false,
  showCode = true,
  onHover,
  onClick,
}: TeamBadgeProps) {
  const interactive = Boolean(onClick || onHover);
  const groupColor = groupColors[team.group];

  return (
    <button
      type="button"
      disabled={!interactive}
      onMouseEnter={() => onHover?.(team.fifaCode)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(team.fifaCode)}
      onBlur={() => onHover?.(null)}
      onClick={() => onClick?.(team.fifaCode)}
      title={team.countryName}
      className={[
        "group flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition",
        interactive ? "cursor-pointer" : "cursor-default",
        selected
          ? "bg-brand-blue text-white shadow-card ring-2 ring-brand-gold"
          : hovered
          ? "bg-brand-sky/15 ring-1 ring-brand-sky"
          : "bg-white/70 hover:bg-brand-sky/10 ring-1 ring-slate-200",
      ].join(" ")}
    >
      <Flag team={team} className="h-6 w-8" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold leading-tight">
          {team.teamName}
          <span
            className={[
              "ml-1 text-xs font-normal",
              selected ? "text-white/70" : "text-slate-400",
            ].join(" ")}
          >
            {team.nameZh}
          </span>
        </span>
        {showCode && (
          <span
            className={[
              "block text-[11px] font-medium leading-tight",
              selected ? "text-white/80" : "text-slate-500",
            ].join(" ")}
          >
            {team.fifaCode}
            {!team.isSovereignCountry && " • UK nation"}
          </span>
        )}
      </span>
      {showGroup && (
        <span
          className={[
            "ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
            selected ? "bg-white/20 text-white" : `${groupColor.bg} ${groupColor.text}`,
          ].join(" ")}
        >
          {team.group}
        </span>
      )}
    </button>
  );
}
