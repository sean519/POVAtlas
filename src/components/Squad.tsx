import type { SquadMember, SquadPosition, StarPlayer, Team } from "../types";

interface SquadProps {
  team: Team;
  /** Full 26-player roster (preferred). Empty until curated. */
  squad: SquadMember[];
  /** Curated stars — used to link a roster member to a tappable profile, and
   * as the fallback list when the full squad isn't available yet. */
  stars: StarPlayer[];
  onSelectPlayer: (team: Team, player: StarPlayer) => void;
}

/** Position buckets, in the order a real roster is usually listed. */
const POSITION_GROUPS: { key: SquadPosition; label: string; icon: string }[] = [
  { key: "GK", label: "Goalkeepers", icon: "🧤" },
  { key: "DF", label: "Defenders", icon: "🛡️" },
  { key: "MF", label: "Midfielders", icon: "🎯" },
  { key: "FW", label: "Forwards", icon: "⚽" },
];

/** Normalise a name for matching squad members to curated star profiles. */
function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export default function Squad({
  team,
  squad,
  stars,
  onSelectPlayer,
}: SquadProps) {
  // No full roster yet → fall back to the curated stars (legacy view).
  if (!squad.length) {
    return <StarsFallback team={team} stars={stars} onSelectPlayer={onSelectPlayer} />;
  }

  const starByName = new Map(stars.map((s) => [normalize(s.name), s]));

  const groups = POSITION_GROUPS.map((g) => ({
    ...g,
    members: squad
      .filter((p) => p.position === g.key)
      .sort((a, b) => a.number - b.number),
  })).filter((g) => g.members.length > 0);

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-400">
        Full 26-player squad · tap a ⭐ star for their profile
      </p>

      {groups.map((g) => (
        <section key={g.key}>
          <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <span aria-hidden>{g.icon}</span>
            {g.label}
            <span className="text-slate-300">· {g.members.length}</span>
          </h4>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {g.members.map((p) => {
              const star = starByName.get(normalize(p.name));
              const rowClass =
                "flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left";
              const inner = (
                <>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-navy/5 text-xs font-bold text-brand-navy">
                    {p.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-700">
                      {p.name}
                    </span>
                    <span className="block truncate text-[11px] text-slate-400">
                      {p.club}
                    </span>
                  </span>
                  {star && (
                    <span className="shrink-0 rounded-md bg-brand-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                      ⭐
                    </span>
                  )}
                </>
              );

              return star ? (
                <button
                  key={p.number}
                  type="button"
                  onClick={() => onSelectPlayer(team, star)}
                  className={`${rowClass} transition hover:border-brand-sky/60 hover:bg-slate-50`}
                >
                  {inner}
                </button>
              ) : (
                <div key={p.number} className={rowClass}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="text-center text-[10px] text-slate-400">
        Official 26-player squad as announced; clubs at call-up time.
      </p>
    </div>
  );
}

/** Legacy view: just the curated stars, each tappable to a profile. */
function StarsFallback({
  team,
  stars,
  onSelectPlayer,
}: Omit<SquadProps, "squad">) {
  if (!stars.length) {
    return (
      <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
        Squad list for {team.teamName} is coming soon.
      </p>
    );
  }

  const sorted = [...stars].sort((a, b) => b.fame - a.fame);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-400">
        Key players · tap anyone for their full profile
      </p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {sorted.map((p) => (
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
      <p className="text-center text-[10px] text-slate-400">
        Full 26-player squad coming soon.
      </p>
    </div>
  );
}
