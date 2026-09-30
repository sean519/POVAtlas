import type { Team } from "../types";
import { compareCountries } from "../utils/countryData";
import {
  formatArea,
  formatGDP,
  formatPerCapita,
  formatPopulation,
} from "../utils/formatters";
import { getStarPlayers, matchWinChance } from "../utils/dataHelpers";
import Flag from "./Flag";
import WinChanceBar from "./WinChanceBar";
import StarPlayers from "./StarPlayers";

/** Scoreline of the match this comparison was opened from, once played. */
export interface ComparisonResult {
  scoreA: number;
  scoreB: number;
  /** Stage label, e.g. "Group A" or "Final". */
  stage: string;
  /** "a.e.t." or "3–4 pens", when relevant. */
  note?: string;
}

interface CountryComparisonCardProps {
  /** fifaCodes of the two teams being compared. */
  codeA: string;
  codeB: string;
  result?: ComparisonResult | null;
  /** Opens the full Atlas comparison of these two countries. */
  onMoreStats?: () => void;
  onClose: () => void;
  onCollapse?: () => void;
  onSelectTeam: (code: string) => void;
  onHoverTeam: (code: string | null) => void;
}

type Winner = "a" | "b" | "tie";

export default function CountryComparisonCard({
  codeA,
  codeB,
  result,
  onMoreStats,
  onClose,
  onCollapse,
  onSelectTeam,
  onHoverTeam,
}: CountryComparisonCardProps) {
  const comparison = compareCountries(codeA, codeB);
  if (!comparison) return null;
  const { teamA, teamB, factsA, factsB, summary } = comparison;
  const chance = matchWinChance(teamA.fifaCode, teamB.fifaCode);
  const starsA = getStarPlayers(teamA.fifaCode);
  const starsB = getStarPlayers(teamB.fifaCode);

  const rows: {
    label: string;
    a: string;
    b: string;
    winner: Winner;
  }[] = [];

  if (factsA && factsB) {
    rows.push(
      numericRow("Population", factsA.population, factsB.population, formatPopulation),
      numericRow("GDP (total)", factsA.gdpUsd, factsB.gdpUsd, formatGDP),
      numericRow(
        "GDP per person",
        factsA.gdpPerCapitaUsd,
        factsB.gdpPerCapitaUsd,
        formatPerCapita
      ),
      numericRow("Area", factsA.areaKm2, factsB.areaKm2, formatArea),
      textRow("Capital", factsA.capital, factsB.capital),
      textRow(
        "Main language",
        factsA.languages[0] ?? "—",
        factsB.languages[0] ?? "—"
      ),
      textRow("Continent", teamA.continent, teamB.continent)
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header: Team A vs Team B */}
      <div className="bg-brand-pitch p-4 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/80">
            {result ? `${result.stage} · result` : "Country comparison"}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Collapse card"
                title="Collapse"
                className="rounded-full bg-white/10 px-2 py-0.5 text-base leading-none text-white/80 transition hover:bg-white/25 hover:text-white"
              >
                –
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close comparison"
              className="rounded-full bg-white/10 px-2 py-0.5 text-lg leading-none text-white/80 transition hover:bg-white/25 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TeamHead
            team={teamA}
            align="start"
            onClick={() => onSelectTeam(teamA.fifaCode)}
            onHover={(h) => onHoverTeam(h ? teamA.fifaCode : null)}
          />
          {result ? (
            <span className="flex flex-col items-center leading-tight">
              <span className="rounded-lg bg-white px-2 py-0.5 text-base font-extrabold text-brand-pitch">
                {result.scoreA} – {result.scoreB}
              </span>
              {result.note && (
                <span className="mt-0.5 text-[10px] font-semibold text-white/80">{result.note}</span>
              )}
            </span>
          ) : (
            <span className="text-xs font-black text-white/70">VS</span>
          )}
          <TeamHead
            team={teamB}
            align="end"
            onClick={() => onSelectTeam(teamB.fifaCode)}
            onHover={(h) => onHoverTeam(h ? teamB.fifaCode : null)}
          />
        </div>
      </div>

      <div className="nice-scroll flex-1 overflow-y-auto p-4">
        {factsA && factsB ? (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            {rows.map((r, i) => (
              <div
                key={r.label}
                className={[
                  "grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 text-sm",
                  i % 2 ? "bg-white" : "bg-slate-50",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-right font-semibold",
                    r.winner === "a" ? "text-brand-pitch" : "text-slate-600",
                  ].join(" ")}
                >
                  {r.winner === "a" && "▲ "}
                  {r.a}
                </span>
                <span className="whitespace-nowrap text-center text-[10px] font-bold uppercase text-slate-400">
                  {r.label}
                </span>
                <span
                  className={[
                    "text-left font-semibold",
                    r.winner === "b" ? "text-brand-pitch" : "text-slate-600",
                  ].join(" ")}
                >
                  {r.b}
                  {r.winner === "b" && " ▲"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
            Detailed facts are not available for both countries yet.
          </p>
        )}

        {/* Estimated win chance */}
        {chance && (
          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue">
              ⚡ {result ? "Pre-match win chance (estimate)" : "Win chance (estimate)"}
            </h3>
            <WinChanceBar chance={chance} teamA={teamA} teamB={teamB} />
          </section>
        )}

        {/* Star players for both teams */}
        {(starsA.length > 0 || starsB.length > 0) && (
          <section className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
            <StarPlayers
              players={starsA}
              heading={`⭐ ${teamA.teamName}`}
            />
            <StarPlayers
              players={starsB}
              heading={`⭐ ${teamB.teamName}`}
            />
          </section>
        )}

        {/* Kid-friendly summary */}
        <div className="mt-4 rounded-xl border border-brand-gold/50 bg-brand-gold/15 p-3">
          <p className="text-sm font-bold text-brand-navy">💡 In simple words</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{summary}</p>
        </div>

        {onMoreStats && (
          <button
            type="button"
            onClick={onMoreStats}
            className="mt-3 w-full rounded-lg bg-brand-blue/10 px-3 py-2 text-sm font-bold text-brand-blue transition hover:bg-brand-blue/20"
          >
            ⚖️ Compare 9 more statistics in the Atlas ›
          </button>
        )}
        <p className="mt-3 text-center text-[11px] text-slate-400">
          Tap a flag above to open that country&rsquo;s full details.
        </p>
      </div>
    </div>
  );
}

function TeamHead({
  team,
  align,
  onClick,
  onHover,
}: {
  team: Team;
  align: "start" | "end";
  onClick: () => void;
  onHover: (hovering: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={[
        "flex items-center gap-2 rounded-lg p-1 transition hover:bg-white/10",
        align === "end" ? "flex-row-reverse text-right" : "text-left",
      ].join(" ")}
    >
      <Flag team={team} className="h-7 w-10" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold leading-tight">
          {team.teamName}
        </span>
        <span className="block text-[11px] text-white/80">{team.nameZh}</span>
      </span>
    </button>
  );
}

function numericRow(
  label: string,
  a: number,
  b: number,
  fmt: (n: number) => string
) {
  const winner: Winner = a === b ? "tie" : a > b ? "a" : "b";
  return { label, a: fmt(a), b: fmt(b), winner };
}

function textRow(label: string, a: string, b: string) {
  return { label, a, b, winner: "tie" as Winner };
}
