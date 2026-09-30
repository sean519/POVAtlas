import { useEffect, useState } from "react";
import type { CountryFacts, WorldCountry } from "../../types";
import { METRICS, useWorldData } from "../../utils/world";
import CountryFlag from "./CountryFlag";

/**
 * Profile of any country (the Atlas): World Bank statistics, key facts,
 * clickable neighbours, plus the curated write-up where one exists.
 */
export default function AtlasCountryCard({
  code,
  worldCupTeamName,
  onClose,
  onCollapse,
  onShowCountry,
  onCompare,
  onOpenWorldCup,
}: {
  code: string;
  /** Set when this country played at the 2026 World Cup. */
  worldCupTeamName?: string;
  onClose: () => void;
  onCollapse: () => void;
  onShowCountry: (code: string) => void;
  onCompare: (code: string) => void;
  onOpenWorldCup?: () => void;
}) {
  const world = useWorldData();
  const [facts, setFacts] = useState<CountryFacts | null>(null);
  useEffect(() => {
    let cancelled = false;
    setFacts(null);
    import("../../data/countryFacts")
      .then((m) => !cancelled && setFacts(m.countryFacts.find((f) => f.isoA3Code === code) ?? null))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code]);

  const c = world?.byCode.get(code);
  if (!c) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading…</div>;
  }
  const neighbours = c.borders
    .map((b) => world?.byCode.get(b))
    .filter((n): n is WorldCountry => Boolean(n));

  return (
    <div className="flex h-full flex-col">
      <div className="bg-brand-navy p-4 text-white">
        <div className="flex items-start gap-3">
          <CountryFlag country={c} className="h-11 w-16 ring-2 ring-white/40" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-extrabold leading-tight">
              {c.name}
              <span className="ml-1.5 text-base font-semibold text-white/80">{c.nameZh}</span>
            </h2>
            {c.official !== c.name && <p className="truncate text-sm text-white/70">{c.official}</p>}
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-bold">{c.code}</span>
              <span className="rounded-md bg-white/15 px-1.5 py-0.5">{c.subregion || c.region}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Collapse card"
              className="rounded-full bg-white/10 px-2 py-0.5 text-base leading-none text-white/80 transition hover:bg-white/25 hover:text-white"
            >
              –
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full bg-white/10 px-2 py-0.5 text-lg leading-none text-white/80 transition hover:bg-white/25 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <div className="nice-scroll flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-1.5">
          {METRICS.map((m) => {
            const v = m.get(c);
            return (
              <div key={m.key} className="rounded-lg bg-slate-50 px-2 py-1.5">
                <div className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {m.icon} {m.label}
                </div>
                <div className="text-sm font-bold text-slate-700">
                  {v ? m.format(v.value) : "—"}
                  {v?.year && <span className="ml-1 text-[10px] font-normal text-slate-400">{v.year}</span>}
                </div>
              </div>
            );
          })}
        </div>

        <dl className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-3 text-sm">
          <Fact label="Capital" value={c.capital || "—"} />
          <Fact label="Language(s)" value={c.languages.join(", ") || "—"} />
          <Fact label="Currency" value={c.currencies.join(", ") || "—"} />
          <Fact label="Coastline" value={c.landlocked ? "None — landlocked" : "Yes"} />
        </dl>

        <section className="mt-3">
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-blue">
            Neighbours {neighbours.length > 0 && `(${neighbours.length})`}
          </h3>
          {neighbours.length ? (
            <div className="flex flex-wrap gap-1.5">
              {neighbours.map((n) => (
                <button
                  key={n.code}
                  type="button"
                  onClick={() => onShowCountry(n.code)}
                  className="flex items-center gap-1 rounded-full border border-slate-200 bg-white py-0.5 pl-1 pr-2 text-xs font-semibold text-slate-600 transition hover:border-brand-sky hover:bg-brand-sky/5"
                >
                  <CountryFlag country={n} className="h-3.5 w-5" />
                  {n.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No land borders — surrounded by sea.</p>
          )}
        </section>

        {facts && (
          <>
            <section className="mt-4">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-blue">About</h3>
              <p className="text-sm leading-relaxed text-slate-600">{facts.shortIntro}</p>
            </section>
            {facts.topAttractions && facts.topAttractions.length > 0 && (
              <section className="mt-3">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-blue">📍 Must-see places</h3>
                <ul className="space-y-1">
                  {facts.topAttractions.map((a) => (
                    <li key={a.name} className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">{a.name}</span> — {a.blurb}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={() => onCompare(c.code)}
            className="rounded-lg bg-brand-blue px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-navy"
          >
            ⚖️ Compare {c.name} with…
          </button>
          {worldCupTeamName && onOpenWorldCup && (
            <button
              type="button"
              onClick={onOpenWorldCup}
              className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100"
            >
              ⚽ {worldCupTeamName} at the 2026 World Cup ›
            </button>
          )}
        </div>
        <p className="mt-3 text-center text-[10px] text-slate-400">
          Statistics: World Bank Open Data (year shown) · facts: mledoze/countries
        </p>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-right text-sm font-semibold text-slate-700">{value}</dd>
    </div>
  );
}
