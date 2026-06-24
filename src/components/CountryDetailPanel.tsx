import type { ReactNode } from "react";
import type { CountryFacts, Match, Team } from "../types";
import { groupColors } from "../utils/groupColors";
import { getStarPlayers } from "../utils/dataHelpers";
import MatchCard from "./MatchCard";
import Flag from "./Flag";
import StarPlayers from "./StarPlayers";
import {
  formatArea,
  formatGDP,
  formatPerCapita,
  formatPopulation,
} from "../utils/formatters";

interface CountryDetailPanelProps {
  team: Team;
  facts: CountryFacts | undefined;
  matches: Match[];
  selectedMatchId: string | null;
  hoveredMatchId: string | null;
  onClose: () => void;
  onCollapse?: () => void;
  onHoverMatch: (id: string | null) => void;
  onSelectMatch: (id: string) => void;
}

export default function CountryDetailPanel({
  team,
  facts,
  matches,
  selectedMatchId,
  hoveredMatchId,
  onClose,
  onCollapse,
  onHoverMatch,
  onSelectMatch,
}: CountryDetailPanelProps) {
  const c = groupColors[team.group];
  const stars = getStarPlayers(team.fifaCode);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="relative overflow-hidden bg-brand-navy p-4 text-white">
        <div className="flex items-start gap-3">
          <Flag team={team} className="h-11 w-16 ring-2 ring-white/40" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-extrabold leading-tight">
              {team.teamName}
              <span className="ml-1.5 text-base font-semibold text-white/80">
                {team.nameZh}
              </span>
            </h2>
            <p className="truncate text-sm text-white/70">{team.countryName}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-bold">
                {team.fifaCode}
              </span>
              <span className={`rounded-md px-1.5 py-0.5 font-bold ${c.bg} ${c.text}`}>
                Group {team.group}
              </span>
              <span className="rounded-md bg-white/15 px-1.5 py-0.5">
                {team.continent}
              </span>
            </div>
          </div>
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
              aria-label="Close country details"
              className="rounded-full bg-white/10 px-2 py-0.5 text-lg leading-none text-white/80 transition hover:bg-white/25 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <div className="nice-scroll flex-1 overflow-y-auto p-4">
        {team.specialBoundaryNote && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            ⚠️ {team.specialBoundaryNote}
          </p>
        )}

        {!facts ? (
          <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
            Detailed facts for this country are not available in the sample data
            yet.
          </p>
        ) : (
          <StandardFacts facts={facts} />
        )}

        {/* Star players */}
        {stars.length > 0 && (
          <section className="mt-4 rounded-xl border border-brand-gold/40 bg-brand-gold/10 p-3">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue">
              ⭐ Star players
            </h3>
            <StarPlayers players={stars} />
          </section>
        )}

        {/* Matches */}
        <section className="mt-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue">
            {team.teamName}&rsquo;s matches
          </h3>
          {matches.length === 0 ? (
            <p className="text-sm text-slate-400">No matches in the schedule yet.</p>
          ) : (
            <div className="space-y-2">
              {matches.map((m) => (
                <MatchCard
                  key={m.matchId}
                  match={m}
                  selected={selectedMatchId === m.matchId}
                  hovered={hoveredMatchId === m.matchId}
                  onHover={onHoverMatch}
                  onClick={onSelectMatch}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-right text-sm font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

function StandardFacts({ facts }: { facts: CountryFacts }) {
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <StatRow label="Capital" value={facts.capital} />
        <StatRow label="Region" value={`${facts.region} · ${facts.subregion}`} />
        <StatRow label="Population" value={formatPopulation(facts.population)} />
        <StatRow label="GDP" value={formatGDP(facts.gdpUsd)} />
        <StatRow
          label="GDP per person"
          value={formatPerCapita(facts.gdpPerCapitaUsd)}
        />
        <StatRow label="Area" value={formatArea(facts.areaKm2)} />
        <StatRow label="Language(s)" value={facts.languages.join(", ")} />
        <StatRow label="Currency" value={facts.currency} />
        <StatRow
          label="Neighbors"
          value={facts.neighbors.length ? facts.neighbors.join(", ") : "None (island / coastal)"}
        />
      </div>

      <section className="mt-4">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-blue">
          About
        </h3>
        <p className="text-sm leading-relaxed text-slate-600">{facts.shortIntro}</p>
      </section>

      {facts.topAttractions && facts.topAttractions.length > 0 && (
        <section className="mt-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue">
            📍 Must-see places
          </h3>
          <ul className="space-y-2">
            {facts.topAttractions.map((a) => (
              <li
                key={a.name}
                className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm"
              >
                <p className="text-sm font-bold text-brand-navy">{a.name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  {a.blurb}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-4">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-blue">
          Fun facts
        </h3>
        <ul className="space-y-1.5">
          {facts.funFacts.map((f, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-600">
              <span aria-hidden>✨</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
