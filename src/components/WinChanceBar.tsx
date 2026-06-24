import type { Team, WinChance } from "../types";

interface WinChanceBarProps {
  chance: WinChance;
  teamA: Team;
  teamB: Team;
  /** Compact = thin bar for match rows; full = labelled for the comparison card. */
  variant?: "compact" | "full";
}

/**
 * A three-segment bar showing the estimated win-chance: Team A / Draw / Team B.
 * Clearly a reference estimate, not live betting odds.
 */
export default function WinChanceBar({
  chance,
  teamA,
  teamB,
  variant = "full",
}: WinChanceBarProps) {
  const segments = [
    { value: chance.a, className: "bg-brand-blue", label: teamA.fifaCode },
    { value: chance.draw, className: "bg-slate-300", label: "Draw" },
    { value: chance.b, className: "bg-brand-peach", label: teamB.fifaCode },
  ];

  if (variant === "compact") {
    return (
      <div
        className="mt-2 flex h-1.5 overflow-hidden rounded-full"
        title={`Win chance · ${teamA.fifaCode} ${chance.a}% · Draw ${chance.draw}% · ${teamB.fifaCode} ${chance.b}%`}
      >
        {segments.map((s, i) => (
          <div key={i} className={s.className} style={{ width: `${s.value}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
        <span className="text-brand-blue">
          {teamA.fifaCode} {chance.a}%
        </span>
        <span className="text-slate-400">Draw {chance.draw}%</span>
        <span className="text-brand-peach">
          {chance.b}% {teamB.fifaCode}
        </span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full shadow-inner">
        {segments.map((s, i) => (
          <div
            key={i}
            className={`${s.className} transition-all`}
            style={{ width: `${s.value}%` }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-center text-[10px] text-slate-400">
        Estimated from team strength ratings — for fun &amp; reference, not real odds.
      </p>
    </div>
  );
}
