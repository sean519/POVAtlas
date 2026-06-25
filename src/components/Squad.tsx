import type { StarPlayer, Team } from "../types";

interface SquadProps {
  team: Team;
  players: StarPlayer[];
  onSelectPlayer: (team: Team, player: StarPlayer) => void;
}

/** Position buckets, in the order a real roster is usually listed. */
const POSITION_GROUPS: {
  key: string;
  label: string;
  icon: string;
  match: (pos: string) => boolean;
}[] = [
  {
    key: "GK",
    label: "Goalkeepers",
    icon: "🧤",
    match: (p) => /keeper|goalie|\bgk\b/i.test(p),
  },
  {
    key: "DEF",
    label: "Defenders",
    icon: "🛡️",
    match: (p) => /back|defend|defen[cs]e|\b(cb|rb|lb|rwb|lwb)\b/i.test(p),
  },
  {
    key: "MID",
    label: "Midfielders",
    icon: "🎯",
    match: (p) => /mid/i.test(p),
  },
  {
    key: "FWD",
    label: "Forwards",
    icon: "⚽",
    match: (p) => /forward|strik|wing|attack/i.test(p),
  },
];

/** Assign a player to the first matching position bucket (fallback: "Other"). */
function bucketFor(pos: string): string {
  return POSITION_GROUPS.find((g) => g.match(pos))?.key ?? "OTHER";
}

/**
 * A team's squad shown as a roster grouped by position. Each member is a
 * tappable card that opens the same player profile used by the Players tab.
 */
export default function Squad({ team, players, onSelectPlayer }: SquadProps) {
  if (!players.length) {
    return (
      <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
        Squad list for {team.teamName} is coming soon.
      </p>
    );
  }

  // Most famous first within each bucket.
  const sorted = [...players].sort((a, b) => b.fame - a.fame);
  const groups = [...POSITION_GROUPS, { key: "OTHER", label: "Squad", icon: "👕" }]
    .map((g) => ({
      ...g,
      members: sorted.filter((p) => bucketFor(p.position) === g.key),
    }))
    .filter((g) => g.members.length > 0);

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-400">
        Key players · tap anyone for their full profile
      </p>

      {groups.map((g) => (
        <section key={g.key}>
          <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <span aria-hidden>{g.icon}</span>
            {g.label}
            <span className="text-slate-300">· {g.members.length}</span>
          </h4>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {g.members.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => onSelectPlayer(team, p)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left transition hover:border-brand-sky/60 hover:bg-slate-50"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-navy/5 text-sm font-bold text-brand-navy">
                  {p.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-700">
                    {p.name}
                  </span>
                  <span className="block truncate text-[11px] text-slate-400">
                    {p.position}
                  </span>
                </span>
                <span className="shrink-0 rounded-md bg-brand-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                  ⭐ {p.fame}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <p className="text-center text-[10px] text-slate-400">
        Showing notable players; full match-day squads vary.
      </p>
    </div>
  );
}
