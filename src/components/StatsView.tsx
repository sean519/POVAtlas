import { useMemo } from "react";
import type { Match } from "../types";
import { computeTournamentStats, getTeamByCode } from "../utils/dataHelpers";
import { topScorers } from "../data/topScorers";
import Flag from "./Flag";

interface StatsViewProps {
  matches: Match[];
  onSelectTeam: (code: string) => void;
  onSelectMatch: (id: string) => void;
  onHoverTeam: (code: string | null) => void;
}

/** Tournament-wide statistics, Google-style: hero numbers + leaderboards. */
export default function StatsView({
  matches,
  onSelectTeam,
  onSelectMatch,
  onHoverTeam,
}: StatsViewProps) {
  const stats = useMemo(() => computeTournamentStats(matches), [matches]);

  const bw = stats.biggestWin;
  const bwA = bw ? getTeamByCode(bw.teamA) : undefined;
  const bwB = bw ? getTeamByCode(bw.teamB) : undefined;

  const hs = stats.highestScoring;
  const hsA = hs ? getTeamByCode(hs.teamA) : undefined;
  const hsB = hs ? getTeamByCode(hs.teamB) : undefined;

  // Golden Boot list with resolved teams (for flags).
  const scorers = useMemo(
    () =>
      topScorers
        .map((s) => ({ ...s, team: getTeamByCode(s.teamCode) }))
        .filter((s): s is typeof s & { team: NonNullable<typeof s.team> } =>
          Boolean(s.team)
        ),
    []
  );

  const tiles = [
    { label: "Goals", value: stats.totalGoals },
    { label: "Matches", value: `${stats.playedMatches}/${stats.totalMatches}` },
    { label: "Goals / match", value: stats.avgGoals.toFixed(2) },
    { label: "Teams scored", value: stats.teamsScored },
  ];

  return (
    <div className="space-y-4">
      {/* Hero stat tiles */}
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

      {/* Golden Boot — top scorers (players) */}
      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-blue">
          🥇 Golden Boot · top scorers
        </h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {scorers.map((s, i) => (
            <button
              key={`${s.teamCode}-${s.name}`}
              type="button"
              onMouseEnter={() => onHoverTeam(s.teamCode)}
              onMouseLeave={() => onHoverTeam(null)}
              onClick={() => onSelectTeam(s.teamCode)}
              className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm transition first:border-0 hover:bg-slate-50"
            >
              <span className="w-4 text-center text-xs font-bold text-slate-400">
                {i + 1}
              </span>
              <Flag team={s.team} className="h-5 w-7" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-slate-700">
                  {s.name}
                </span>
                <span className="block truncate text-[11px] text-slate-400">
                  {s.team.teamName}
                </span>
              </span>
              <span className="shrink-0 rounded-md bg-brand-gold/20 px-2 py-0.5 text-xs font-bold text-amber-600">
                {s.goals} ⚽
              </span>
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          Goal tallies from official tournament data (through the group stage so far).
        </p>
      </section>

      {/* Most goals (by team) */}
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
            💥 Biggest win
          </h3>
          <ResultCard
            a={bwA}
            b={bwB}
            scoreA={bw.scoreA}
            scoreB={bw.scoreB}
            onClick={() => onSelectMatch(bw.matchId)}
          />
        </section>
      )}

      {/* Highest-scoring match */}
      {hs && hsA && hsB && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue">
            🔥 Most goals in a match
          </h3>
          <ResultCard
            a={hsA}
            b={hsB}
            scoreA={hs.scoreA}
            scoreB={hs.scoreB}
            onClick={() => onSelectMatch(hs.matchId)}
          />
        </section>
      )}
    </div>
  );
}

/** Small clickable scoreline card used for biggest win / highest scoring. */
function ResultCard({
  a,
  b,
  scoreA,
  scoreB,
  onClick,
}: {
  a: import("../types").Team;
  b: import("../types").Team;
  scoreA: number | null;
  scoreB: number | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm transition hover:border-brand-sky hover:bg-brand-sky/5"
    >
      <span className="flex items-center gap-1.5">
        <Flag team={a} className="h-5 w-7" />
        <span className="font-semibold">{a.fifaCode}</span>
      </span>
      <span className="rounded-lg bg-brand-navy px-2 py-0.5 font-bold text-white">
        {scoreA} – {scoreB}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-semibold">{b.fifaCode}</span>
        <Flag team={b} className="h-5 w-7" />
      </span>
    </button>
  );
}
