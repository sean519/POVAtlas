import { useMemo } from "react";
import { computeTournamentStats, getTeamByCode } from "../utils/dataHelpers";
import Flag from "./Flag";

interface StatsViewProps {
  onSelectTeam: (code: string) => void;
  onSelectMatch: (id: string) => void;
  onHoverTeam: (code: string | null) => void;
}

/** Tournament-wide statistics computed from played matches. */
export default function StatsView({
  onSelectTeam,
  onSelectMatch,
  onHoverTeam,
}: StatsViewProps) {
  const stats = useMemo(() => computeTournamentStats(), []);
  const bw = stats.biggestWin;
  const bwA = bw ? getTeamByCode(bw.teamA) : undefined;
  const bwB = bw ? getTeamByCode(bw.teamB) : undefined;

  const tiles = [
    { label: "Matches played", value: `${stats.playedMatches}/${stats.totalMatches}` },
    { label: "Total goals", value: stats.totalGoals },
    { label: "Goals / match", value: stats.avgGoals.toFixed(2) },
    {
      label: "Teams scored",
      value: stats.topScorers.length,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm"
          >
            <div className="text-2xl font-extrabold text-brand-blue">{t.value}</div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {t.label}
            </div>
          </div>
        ))}
      </div>

      {/* Top scorers (by team) */}
      <section>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue">
          ⚽ Most goals (by team)
        </h3>
        {stats.topScorers.length === 0 ? (
          <p className="text-sm text-slate-400">No goals scored yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {stats.topScorers.map((s, i) => (
              <button
                key={s.team.fifaCode}
                type="button"
                onMouseEnter={() => onHoverTeam(s.team.fifaCode)}
                onMouseLeave={() => onHoverTeam(null)}
                onClick={() => onSelectTeam(s.team.fifaCode)}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm transition first:border-0 hover:bg-slate-50"
              >
                <span className="w-4 text-center text-xs font-bold text-slate-400">
                  {i + 1}
                </span>
                <Flag team={s.team} className="h-5 w-7" />
                <span className="flex-1 font-semibold">{s.team.teamName}</span>
                <span className="rounded-md bg-brand-green/15 px-2 py-0.5 text-xs font-bold text-brand-pitch">
                  {s.goals} ⚽
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Biggest win */}
      {bw && bwA && bwB && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue">
            💥 Biggest win so far
          </h3>
          <button
            type="button"
            onClick={() => onSelectMatch(bw.matchId)}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm transition hover:border-brand-sky hover:bg-brand-sky/5"
          >
            <span className="flex items-center gap-1.5">
              <Flag team={bwA} className="h-5 w-7" />
              <span className="font-semibold">{bwA.fifaCode}</span>
            </span>
            <span className="rounded-lg bg-brand-navy px-2 py-0.5 font-bold text-white">
              {bw.scoreA} – {bw.scoreB}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-semibold">{bwB.fifaCode}</span>
              <Flag team={bwB} className="h-5 w-7" />
            </span>
          </button>
        </section>
      )}
    </div>
  );
}
