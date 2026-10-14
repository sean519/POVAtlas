import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { EventTeam, SportEvent, WorldCountry } from "../../types";
import { distanceKm, flagSrc, formatCompact, useWorldData, type WorldData } from "../../utils/world";
import { eventCountries, eventStatus, eventTeams, orderEvents } from "../../utils/events";
import { formatShortDate } from "../../utils/formatters";

/** Flag images for teams that aren't a whole country (flagcdn codes). */
const TEAM_FLAG: Record<string, string> = {
  ENG: "gb-eng",
  SCO: "gb-sct",
  WAL: "gb-wls",
  NIR: "gb-nir",
};
/** Teams shown without a national flag (they compete under a neutral one). */
const NEUTRAL_FLAG = new Set(["TPE", "AIN", "EOR"]);

/**
 * 🏅 Sports events: pick an event, see every team's country/region on the map,
 * and tap a team to learn about the place behind it.
 */
export default function EventsPanel({
  events,
  selectedId,
  onSelect,
  selectedCode,
  onShowCountry,
  onOpenWorldCup,
}: {
  events: SportEvent[];
  selectedId: string;
  onSelect: (id: string) => void;
  selectedCode: string | null;
  onShowCountry: (atlas: string) => void;
  onOpenWorldCup: () => void;
}) {
  const world = useWorldData();
  const ordered = useMemo(() => orderEvents(events), [events]);
  const ev = events.find((e) => e.id === selectedId) ?? ordered[0];

  // Keep the selected chip visible in the scrolling picker (e.g. deep links).
  const chipRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    chipRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [ev.id]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Event picker */}
      <div className="nice-scroll flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-slate-50 px-1.5 py-1.5">
        {ordered.map((e) => {
          const st = eventStatus(e);
          return (
            <button
              key={e.id}
              ref={e.id === ev.id ? chipRef : undefined}
              type="button"
              onClick={() => onSelect(e.id)}
              className={[
                "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-bold transition",
                e.id === ev.id
                  ? "bg-white text-brand-blue shadow ring-1 ring-brand-sky/40"
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
              ].join(" ")}
            >
              <span aria-hidden>{e.icon}</span>
              <span className="leading-tight">
                {e.name}
                <span
                  className={`block text-[10px] font-semibold ${
                    st.state === "live" ? "text-red-600" : st.state === "upcoming" ? "text-sky-600" : "text-slate-400"
                  }`}
                >
                  {st.state === "live" ? "● Live" : st.state === "upcoming" ? "Upcoming" : "Finished"}
                </span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenWorldCup}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-bold text-slate-500 transition hover:bg-white/70 hover:text-slate-700"
        >
          <span aria-hidden>⚽</span>
          <span className="leading-tight">
            Men's World Cup 2026
            <span className="block text-[10px] font-semibold text-slate-400">Full section ›</span>
          </span>
        </button>
      </div>

      <div className="nice-scroll flex-1 overflow-y-auto p-3">
        {!world ? (
          <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        ) : (
          <div className="space-y-3">
            <EventHeader ev={ev} world={world} />
            <InNumbers ev={ev} world={world} />
            {ev.kind === "groups" && (
              <GroupsView ev={ev} world={world} selectedCode={selectedCode} onShowCountry={onShowCountry} />
            )}
            {ev.kind === "ranking" && (
              <RankingView ev={ev} world={world} selectedCode={selectedCode} onShowCountry={onShowCountry} />
            )}
            {ev.kind === "medals" && (
              <MedalsView ev={ev} world={world} selectedCode={selectedCode} onShowCountry={onShowCountry} />
            )}
            <p className="text-center text-[10px] text-slate-400">
              Teams & results:{" "}
              <a href={ev.source} target="_blank" rel="noreferrer" className="underline hover:text-slate-600">
                Wikipedia
              </a>{" "}
              · country facts: World Bank & mledoze/countries
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventHeader({ ev, world }: { ev: SportEvent; world: WorldData }) {
  const st = eventStatus(ev);
  const host = world.byCode.get(ev.hostCode);
  const teams = eventTeams(ev).length;
  const places = eventCountries(ev).length;
  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none" aria-hidden>
          {ev.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold leading-tight text-brand-navy">{ev.name}</h3>
          <p className="text-sm text-slate-500">
            {ev.nameZh} · {ev.sport} {ev.sportZh}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
            st.state === "live"
              ? "animate-pulse bg-red-100 text-red-700"
              : st.state === "upcoming"
              ? "bg-sky-100 text-sky-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {st.state === "live" ? `● ${st.label}` : st.label}
        </span>
      </div>
      <div className="mt-2 space-y-0.5 text-xs text-slate-600">
        <p className="flex items-center gap-1.5">
          📍{" "}
          {host && <img src={flagSrc(host.iso2)} alt="" className="h-3 w-4 rounded-[2px] object-cover ring-1 ring-black/10" />}
          <span className="font-semibold">{ev.city}</span> <span className="text-slate-400">{ev.cityZh}</span>
        </p>
        <p>
          📅 {formatShortDate(ev.start)} – {formatShortDate(ev.end)}, {ev.end.slice(0, 4)}
        </p>
        <p>
          👥{" "}
          {ev.totalTeams && teams < ev.totalTeams
            ? `${teams} of ${ev.totalTeams} teams qualified so far`
            : ev.kind === "medals"
            ? `${teams} teams won medals`
            : `${teams} teams`}{" "}
          · from {places} countries & regions
        </p>
      </div>
      {ev.note && <p className="mt-2 rounded-lg bg-white/70 px-2 py-1.5 text-[11px] text-slate-500">ℹ️ {ev.note}</p>}
    </section>
  );
}

/** Data-driven highlights about the places taking part. */
function InNumbers({ ev, world }: { ev: SportEvent; world: WorldData }) {
  const lines = useMemo(() => {
    const places = eventCountries(ev)
      .map((c) => world.byCode.get(c))
      .filter((c): c is WorldCountry => Boolean(c));
    const out: string[] = [];
    const regions = new Set(places.map((p) => p.region));
    out.push(`🌐 From ${regions.size} continent${regions.size === 1 ? "" : "s"}: ${[...regions].sort().join(", ")}.`);

    const withPop = places.filter((p) => p.population);
    if (withPop.length >= 2) {
      const sorted = [...withPop].sort((a, b) => b.population![0] - a.population![0]);
      const big = sorted[0];
      const small = sorted[sorted.length - 1];
      out.push(
        `👥 Most people: ${big.name} (${formatCompact(big.population![0])}) · fewest: ${small.name} (${formatCompact(small.population![0])}).`
      );
    }

    const host = world.byCode.get(ev.hostCode);
    if (host) {
      const far = places
        .filter((p) => p.code !== host.code)
        .map((p) => ({ p, km: distanceKm(p.lat, p.lng, host.lat, host.lng) }))
        .sort((a, b) => b.km - a.km)[0];
      if (far) {
        out.push(
          `✈️ Longest trip to ${host.name}: ${far.p.name}, about ${(Math.round(far.km / 100) * 100).toLocaleString("en-US")} km away.`
        );
      }
    }

    if (ev.medals) {
      const total = ev.medals.reduce((s, m) => s + m.total, 0);
      out.push(`🏅 ${total.toLocaleString("en-US")} medals won by ${ev.medals.length} teams.`);
      // Per-capita leader among countries with over a million people.
      const perMillion = ev.medals
        .map((m) => ({ m, c: m.team.atlas ? world.byCode.get(m.team.atlas) : undefined }))
        // Teams like England carry a note — skip them (their population is the UK's).
        .filter((x) => x.c?.population && x.c.population[0] >= 1_000_000 && !x.m.team.note)
        .map((x) => ({ name: x.m.team.name, v: x.m.total / (x.c!.population![0] / 1e6) }))
        .sort((a, b) => b.v - a.v)[0];
      if (perMillion) {
        out.push(`📊 Most medals per million people: ${perMillion.name} (${perMillion.v.toFixed(1)}), among countries over 1M people.`);
      }
    }
    if (ev.ranking) {
      const champ = ev.ranking.find((r) => r.rank === 1);
      if (champ) out.push(`🏆 Champions: ${champ.team.name} ${champ.team.nameZh}.`);
    }
    return out;
  }, [ev, world]);

  return (
    <section className="rounded-xl border border-brand-gold/50 bg-brand-gold/10 p-3">
      <p className="text-xs font-bold text-brand-navy">💡 The teams in numbers</p>
      <ul className="mt-1 space-y-1">
        {lines.map((l) => (
          <li key={l} className="text-sm leading-snug text-slate-700">
            {l}
          </li>
        ))}
      </ul>
    </section>
  );
}

interface ListProps {
  ev: SportEvent;
  world: WorldData;
  selectedCode: string | null;
  onShowCountry: (atlas: string) => void;
}

function GroupsView({ ev, world, selectedCode, onShowCountry }: ListProps) {
  return (
    <div className="space-y-2">
      {ev.groups!.map((g) => (
        <section key={g.name} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <h4 className="flex items-center justify-between bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-blue">
            {g.name}
            <span className="font-semibold normal-case text-slate-400">
              {g.teams.length} team{g.teams.length === 1 ? "" : "s"}
            </span>
          </h4>
          {g.teams.map((t) => (
            <TeamRow key={t.code} team={t} ev={ev} world={world} selected={selectedCode === t.atlas} onShowCountry={onShowCountry} />
          ))}
        </section>
      ))}
    </div>
  );
}

const PLACE: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function RankingView({ ev, world, selectedCode, onShowCountry }: ListProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <h4 className="bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-blue">Final standings</h4>
      {ev.ranking!.map((r) => (
        <TeamRow
          key={r.team.code}
          team={r.team}
          ev={ev}
          world={world}
          selected={selectedCode === r.team.atlas}
          onShowCountry={onShowCountry}
          lead={<span className="w-6 shrink-0 text-center text-xs font-bold text-slate-400">{PLACE[r.rank] ?? r.rank}</span>}
        />
      ))}
    </section>
  );
}

function MedalsView({ ev, world, selectedCode, onShowCountry }: ListProps) {
  const [all, setAll] = useState(false);
  const rows = all ? ev.medals! : ev.medals!.slice(0, 12);
  const unranked = ev.medals!.some((m) => m.rank === null);
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-blue">
        <span className="flex-1">Medal table</span>
        <span className="w-7 text-center">🥇</span>
        <span className="w-7 text-center">🥈</span>
        <span className="w-7 text-center">🥉</span>
        <span className="w-8 text-right">All</span>
      </div>
      {rows.map((m) => (
        <TeamRow
          key={m.team.code}
          team={m.team}
          ev={ev}
          world={world}
          selected={selectedCode === m.team.atlas}
          onShowCountry={onShowCountry}
          lead={<span className="w-6 shrink-0 text-center text-xs font-bold text-slate-400">{m.rank ?? "—"}</span>}
          trail={
            <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums">
              <span className="w-7 text-center font-bold text-amber-600">{m.gold}</span>
              <span className="w-7 text-center text-slate-500">{m.silver}</span>
              <span className="w-7 text-center text-orange-700/80">{m.bronze}</span>
              <span className="w-8 text-right font-bold text-brand-navy">{m.total}</span>
            </span>
          }
          compact
        />
      ))}
      {ev.medals!.length > 12 && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="w-full border-t border-slate-100 py-2 text-xs font-bold text-brand-blue transition hover:bg-slate-50"
        >
          {all ? "Show top 12" : `Show all ${ev.medals!.length} teams`}
        </button>
      )}
      {unranked && all && (
        <p className="border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-400">
          “—” = listed for reference, not part of the official medal table.
        </p>
      )}
    </section>
  );
}

function TeamRow({
  team,
  ev,
  world,
  selected,
  onShowCountry,
  lead,
  trail,
  compact,
}: {
  team: EventTeam;
  ev: SportEvent;
  world: WorldData;
  selected: boolean;
  onShowCountry: (atlas: string) => void;
  lead?: ReactNode;
  trail?: ReactNode;
  /** Medal rows: skip the country fact line to keep the table tight. */
  compact?: boolean;
}) {
  const c = team.atlas ? world.byCode.get(team.atlas) : undefined;
  const isHost = team.atlas === ev.hostCode && !team.note;
  const fact = team.note
    ? team.atlas === "GBR"
      ? "Part of the United Kingdom"
      : team.note
    : c
    ? [c.capital && `Capital ${c.capital}`, c.population && `${formatCompact(c.population[0])} people`].filter(Boolean).join(" · ")
    : "";
  const clickable = Boolean(c);
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => c && onShowCountry(c.code)}
      className={`flex w-full items-center gap-2 border-t border-slate-100 px-3 py-1.5 text-left transition first:border-0 ${
        clickable ? "hover:bg-slate-50" : "cursor-default"
      } ${selected ? "bg-brand-blue/5" : ""}`}
    >
      {lead}
      <TeamFlag team={team} country={c} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">
          <span className="font-semibold text-slate-700">{team.name}</span>{" "}
          <span className="text-xs text-slate-400">{team.nameZh}</span>
          {isHost && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-700">host</span>}
        </span>
        {!compact && fact && <span className="block truncate text-[11px] text-slate-400">{fact}</span>}
      </span>
      {trail}
    </button>
  );
}

function TeamFlag({ team, country }: { team: EventTeam; country: WorldCountry | undefined }) {
  const iso2 = TEAM_FLAG[team.code] ?? country?.iso2;
  if (!iso2 || NEUTRAL_FLAG.has(team.code)) {
    return (
      <span className="inline-flex h-4 w-6 shrink-0 items-center justify-center rounded-[3px] bg-slate-200 text-[7px] font-bold text-slate-500 ring-1 ring-black/10">
        {team.code}
      </span>
    );
  }
  return <img src={flagSrc(iso2)} alt="" loading="lazy" className="h-4 w-6 shrink-0 rounded-[3px] object-cover ring-1 ring-black/10" />;
}
