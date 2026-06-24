import { useMemo } from "react";
import { computeGroupStandings } from "../utils/dataHelpers";
import { groupColors } from "../utils/groupColors";
import Flag from "./Flag";

interface StandingsViewProps {
  selectedTeamCode: string | null;
  hoveredTeamCode: string | null;
  onSelectTeam: (code: string) => void;
  onHoverTeam: (code: string | null) => void;
}

/** Group-by-group standings tables computed from played matches. */
export default function StandingsView({
  selectedTeamCode,
  hoveredTeamCode,
  onSelectTeam,
  onHoverTeam,
}: StandingsViewProps) {
  const standings = useMemo(() => computeGroupStandings(), []);

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-400">
        Standings update from played results. Top 2 of each group are shaded.
      </p>
      {standings.map(({ group, rows }) => {
        const c = groupColors[group];
        return (
          <section key={group}>
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <span className={`rounded-md px-1.5 py-0.5 ${c.bg} ${c.text}`}>
                Group {group}
              </span>
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase text-slate-400">
                    <th className="py-1.5 pl-2 text-left font-bold">#</th>
                    <th className="py-1.5 text-left font-bold">Team</th>
                    <th className="px-1 py-1.5 text-center font-bold">P</th>
                    <th className="px-1 py-1.5 text-center font-bold">W</th>
                    <th className="px-1 py-1.5 text-center font-bold">D</th>
                    <th className="px-1 py-1.5 text-center font-bold">L</th>
                    <th className="px-1 py-1.5 text-center font-bold">GD</th>
                    <th className="px-2 py-1.5 text-center font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const selected = selectedTeamCode === r.team.fifaCode;
                    const hovered = hoveredTeamCode === r.team.fifaCode;
                    return (
                      <tr
                        key={r.team.fifaCode}
                        onMouseEnter={() => onHoverTeam(r.team.fifaCode)}
                        onMouseLeave={() => onHoverTeam(null)}
                        onClick={() => onSelectTeam(r.team.fifaCode)}
                        className={[
                          "cursor-pointer border-t border-slate-100 transition",
                          selected
                            ? "bg-brand-blue/10"
                            : hovered
                            ? "bg-brand-sky/10"
                            : i < 2
                            ? "bg-brand-green/5"
                            : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <td className="py-1.5 pl-2 text-slate-400">{i + 1}</td>
                        <td className="py-1.5">
                          <span className="flex items-center gap-1.5">
                            <Flag team={r.team} className="h-4 w-6" />
                            <span className="font-semibold">{r.team.fifaCode}</span>
                          </span>
                        </td>
                        <td className="px-1 text-center text-slate-500">{r.played}</td>
                        <td className="px-1 text-center text-slate-500">{r.win}</td>
                        <td className="px-1 text-center text-slate-500">{r.draw}</td>
                        <td className="px-1 text-center text-slate-500">{r.loss}</td>
                        <td className="px-1 text-center text-slate-500">
                          {r.gd > 0 ? `+${r.gd}` : r.gd}
                        </td>
                        <td className="px-2 text-center font-extrabold text-brand-navy">
                          {r.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
