import type { Team } from "../types";
import { flagUrl } from "../utils/flags";

interface FlagProps {
  team: Team;
  /** Tailwind size classes, e.g. "h-5 w-7". */
  className?: string;
}

/**
 * Renders a real flag image for a team. If the image fails to load (e.g.
 * offline) the team's code shows through as a graceful fallback.
 */
export default function Flag({ team, className = "h-5 w-7" }: FlagProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] bg-slate-200 text-[8px] font-bold uppercase text-slate-500 shadow-sm ring-1 ring-black/10 ${className}`}
      title={`${team.teamName} · ${team.nameZh}`}
    >
      <span className="absolute">{team.fifaCode}</span>
      <img
        src={flagUrl(team.iso2)}
        alt={`${team.teamName} flag`}
        loading="lazy"
        draggable={false}
        className="relative h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </span>
  );
}
