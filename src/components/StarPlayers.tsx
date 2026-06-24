import type { StarPlayer } from "../types";

interface StarPlayersProps {
  players: StarPlayer[];
  heading?: string;
}

/** A small list of a team's key star players with a one-line note each. */
export default function StarPlayers({ players, heading }: StarPlayersProps) {
  if (!players.length) return null;
  return (
    <div>
      {heading && (
        <h4 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {heading}
        </h4>
      )}
      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p.name} className="flex gap-2">
            <span aria-hidden>⭐</span>
            <span className="min-w-0">
              <span className="text-sm font-semibold text-slate-700">
                {p.name}
              </span>
              <span className="text-xs text-slate-400"> · {p.position}</span>
              <span className="block text-xs leading-snug text-slate-500">
                {p.note}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
