import { useEffect, useMemo, useState } from "react";
import type { CountryFacts } from "../../types";
import { METRIC_BY_KEY, type MetricKey, type WorldData } from "../../utils/world";
import { countryOfWeek, daysUntilNextWeek, weekIndex, weekRange } from "../../utils/daily";
import { formatShortDate } from "../../utils/formatters";
import CountryFlag from "./CountryFlag";

const STAT_KEYS: MetricKey[] = ["population", "area", "gdpPerCapita", "lifeExpectancy"];

/**
 * 🌟 Country of the Week — rotates every Monday through the countries that have
 * curated write-ups (intro, fun facts, must-see places); statistics come from
 * the World Bank dataset.
 */
export default function CountryOfWeek({
  world,
  onShowCountry,
  onCompare,
}: {
  world: WorldData;
  onShowCountry: (code: string) => void;
  onCompare: (code: string) => void;
}) {
  // Curated write-ups are loaded on demand (shared with the country panels).
  const [facts, setFacts] = useState<CountryFacts[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    import("../../data/countryFacts")
      .then((m) => !cancelled && setFacts(m.countryFacts))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const idx = weekIndex();
  const pick = useMemo(() => {
    if (!facts) return null;
    // England/Scotland aren't separate countries in the World Bank data.
    const eligible = facts.filter((f) => world.byCode.has(f.isoA3Code));
    const code = countryOfWeek(eligible.map((f) => f.isoA3Code), idx);
    return { facts: eligible.find((f) => f.isoA3Code === code)!, country: world.byCode.get(code)! };
  }, [facts, world.byCode, idx]);

  if (!pick) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;
  }
  const { facts: f, country: c } = pick;
  const { start, end } = weekRange(idx);
  const nextIn = daysUntilNextWeek();

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 shadow-sm">
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-brand-navy">
            🌟 Country of the Week <span className="font-semibold text-slate-400">· 本周国家</span>
          </h3>
          <span className="shrink-0 text-[11px] text-slate-400">
            {formatShortDate(start)} – {formatShortDate(end)}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <CountryFlag country={c} className="h-10 w-14 ring-2 ring-white" />
          <div className="min-w-0">
            <p className="truncate text-xl font-extrabold leading-tight text-brand-navy">{c.name}</p>
            <p className="text-sm text-slate-500">
              {c.nameZh}
              {c.capital ? ` · Capital ${c.capital}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {STAT_KEYS.map((k) => {
            const m = METRIC_BY_KEY.get(k)!;
            const v = m.get(c);
            return (
              <div key={k} className="rounded-lg bg-white/80 px-2 py-1.5 ring-1 ring-slate-100">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
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

        <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.shortIntro}</p>

        <h4 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-brand-blue">✨ Fun facts</h4>
        <ul className="mt-1 space-y-1">
          {f.funFacts.map((t, i) => (
            <li key={i} className="text-sm text-slate-600">
              • {t}
            </li>
          ))}
        </ul>

        {f.topAttractions && f.topAttractions.length > 0 && (
          <>
            <h4 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-brand-blue">📍 Must-see places</h4>
            <ul className="mt-1 space-y-1">
              {f.topAttractions.map((a) => (
                <li key={a.name} className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">{a.name}</span> — {a.blurb}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onShowCountry(c.code)}
            className="rounded-lg bg-white px-2 py-1.5 text-xs font-bold text-brand-blue shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            🗺️ Explore on the map
          </button>
          <button
            type="button"
            onClick={() => onCompare(c.code)}
            className="rounded-lg bg-white px-2 py-1.5 text-xs font-bold text-brand-blue shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            ⚖️ Compare with…
          </button>
        </div>
      </div>
      <p className="border-t border-amber-100 bg-amber-50/60 px-3 py-1.5 text-center text-[11px] text-amber-700">
        A new country every Monday · next in {nextIn} day{nextIn === 1 ? "" : "s"}
      </p>
    </section>
  );
}
