import { useMemo, useState } from "react";
import { METRICS, METRIC_BY_KEY, searchCountries, type MetricKey, type WorldData } from "../../utils/world";
import CountryFlag from "./CountryFlag";

const REGIONS = ["All", "Africa", "Americas", "Asia", "Europe", "Oceania"] as const;
type Region = (typeof REGIONS)[number];
type SortKey = "name" | MetricKey;

/**
 * 🌐 Every country: search, filter by region, and rank by any statistic.
 * Tapping a row opens that country on the map.
 */
export default function CountryList({
  world,
  selectedCode,
  onShowCountry,
}: {
  world: WorldData;
  selectedCode: string | null;
  onShowCountry: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<Region>("All");
  const [sort, setSort] = useState<SortKey>("population");

  const rows = useMemo(() => {
    const metric = sort === "name" ? null : METRIC_BY_KEY.get(sort)!;
    let list = query.trim()
      ? searchCountries(world.countries, query, 400)
      : world.countries;
    if (region !== "All") list = list.filter((c) => c.region === region);
    const withVal = list.map((c) => ({ c, v: metric?.get(c) ?? null }));
    if (metric) {
      withVal.sort((x, y) => {
        if (!x.v && !y.v) return x.c.name.localeCompare(y.c.name);
        if (!x.v) return 1;
        if (!y.v) return -1;
        return y.v.value - x.v.value;
      });
    } else if (!query.trim()) {
      withVal.sort((x, y) => x.c.name.localeCompare(y.c.name));
    }
    return { metric, items: withVal };
  }, [world.countries, query, region, sort]);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search any country · 搜索国家"
        aria-label="Search countries"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/40"
      />
      <div className="flex flex-wrap gap-1">
        {REGIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              region === r ? "bg-brand-blue text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-500">
        <span className="shrink-0 font-semibold">Rank by</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-brand-sky focus:outline-none"
        >
          <option value="name">Name (A–Z)</option>
          {METRICS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.icon} {m.label} · {m.labelZh}
            </option>
          ))}
        </select>
      </label>
      <p className="text-[11px] text-slate-400">{rows.items.length} countries & territories</p>

      <ul className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {rows.items.map(({ c, v }, i) => (
          <li key={c.code} className="border-t border-slate-100 first:border-0">
            <button
              type="button"
              onClick={() => onShowCountry(c.code)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition hover:bg-slate-50 ${
                selectedCode === c.code ? "bg-brand-blue/5" : ""
              }`}
            >
              {rows.metric && (
                <span className="w-7 shrink-0 text-right text-[11px] font-bold tabular-nums text-slate-400">
                  {v ? i + 1 : ""}
                </span>
              )}
              <CountryFlag country={c} className="h-4 w-6" />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-semibold text-slate-700">{c.name}</span>{" "}
                <span className="text-xs text-slate-400">{c.nameZh}</span>
              </span>
              {rows.metric && (
                <span className="shrink-0 text-xs font-bold tabular-nums text-brand-navy">
                  {v ? rows.metric.format(v.value) : "—"}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {rows.metric && (
        <p className="text-center text-[10px] text-slate-400">
          World Bank Open Data, latest year available per country · “—” = no data
        </p>
      )}
    </div>
  );
}
