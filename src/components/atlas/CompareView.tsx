import { useState } from "react";
import type { WorldCountry } from "../../types";
import { METRICS, distanceKm, type WorldData } from "../../utils/world";
import CountryPicker from "./CountryPicker";
import CountryFlag from "./CountryFlag";

const SUGGESTED: [string, string][] = [
  ["CHN", "IND"],
  ["USA", "CHN"],
  ["JPN", "GBR"],
  ["CAN", "AUS"],
  ["BRA", "ARG"],
  ["DEU", "FRA"],
  ["KOR", "JPN"],
  ["EGY", "NGA"],
];

/** Slot colours — the map uses the same two tones for A and B. */
const TONE = {
  a: { dot: "bg-brand-blue", bar: "bg-brand-blue", text: "text-brand-blue" },
  b: { dot: "bg-brand-peach", bar: "bg-brand-peach", text: "text-orange-500" },
} as const;

/**
 * ⚖️ Compare any two countries: side-by-side World Bank statistics with bars,
 * an auto-written summary, key facts, and a shareable link.
 */
export default function CompareView({
  world,
  a,
  b,
  onChange,
  onShowCountry,
}: {
  world: WorldData;
  a: string | null;
  b: string | null;
  onChange: (a: string | null, b: string | null) => void;
  onShowCountry: (code: string) => void;
}) {
  const ca = a ? world.byCode.get(a) : undefined;
  const cb = b ? world.byCode.get(b) : undefined;
  const [copied, setCopied] = useState(false);

  const random = () => {
    const pool = world.countries.filter((c) => (c.population?.[0] ?? 0) >= 1_000_000);
    const x = pool[Math.floor(Math.random() * pool.length)];
    let y = x;
    while (y.code === x.code) y = pool[Math.floor(Math.random() * pool.length)];
    onChange(x.code, y.code);
  };

  const share = async () => {
    if (!ca || !cb) return;
    const url = `${window.location.origin}/?compare=${ca.code},${cb.code}`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: `${ca.name} vs ${cb.name} · POV Atlas`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // dismissed / blocked
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-extrabold text-brand-navy">
          ⚖️ Compare any two countries <span className="font-semibold text-slate-400">· 国家对比</span>
        </h3>
        <p className="text-[11px] text-slate-400">Search below, or tap two countries on the map.</p>
      </div>

      <div className="space-y-2">
        <Slot tone="a" country={ca} countries={world.countries} exclude={b} onPick={(c) => onChange(c, b)} />
        <Slot tone="b" country={cb} countries={world.countries} exclude={a} onPick={(c) => onChange(a, c)} />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!a && !b}
            onClick={() => onChange(b, a)}
            className="flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-40"
          >
            ⇅ Swap
          </button>
          <button
            type="button"
            onClick={random}
            className="flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
          >
            🎲 Random pair
          </button>
        </div>
      </div>

      {!(ca && cb) && (
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Try one</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED.map(([x, y]) => {
              const cx = world.byCode.get(x)!;
              const cy = world.byCode.get(y)!;
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  onClick={() => onChange(x, y)}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-brand-sky hover:bg-brand-sky/5"
                >
                  {cx.name} vs {cy.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {ca && cb && (
        <>
          <Nutshell a={ca} b={cb} />

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {METRICS.map((m) => {
              const va = m.get(ca);
              const vb = m.get(cb);
              const max = Math.max(va?.value ?? 0, vb?.value ?? 0);
              const hi = va && vb ? (va.value >= vb.value ? "a" : "b") : null;
              const ratio =
                va && vb && Math.min(va.value, vb.value) > 0
                  ? Math.max(va.value, vb.value) / Math.min(va.value, vb.value)
                  : null;
              return (
                <div key={m.key} className="border-t border-slate-100 px-3 py-2 first:border-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-slate-600">
                      {m.icon} {m.label} <span className="font-normal text-slate-400">{m.labelZh}</span>
                    </span>
                    {ratio !== null && ratio >= 1.05 && (
                      <span className={`text-[11px] font-bold ${TONE[hi!].text}`}>
                        {ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1)}×
                      </span>
                    )}
                  </div>
                  {(["a", "b"] as const).map((side) => {
                    const v = side === "a" ? va : vb;
                    const c = side === "a" ? ca : cb;
                    return (
                      <div key={side} className="mt-1 flex items-center gap-2">
                        <CountryFlag country={c} className="h-3.5 w-5" />
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${TONE[side].bar} ${hi && hi !== side ? "opacity-50" : ""}`}
                            style={{ width: v && max > 0 ? `${Math.max(2, (v.value / max) * 100)}%` : "0%" }}
                          />
                        </div>
                        <span
                          className={`w-24 shrink-0 text-right text-xs tabular-nums ${
                            hi === side ? "font-bold text-slate-800" : "text-slate-600"
                          }`}
                        >
                          {v ? m.format(v.value) : "—"}
                          {v?.year && <span className="ml-0.5 text-[9px] font-normal text-slate-400">’{String(v.year).slice(2)}</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white text-xs">
            <FactRow label="Capital" a={ca.capital || "—"} b={cb.capital || "—"} />
            <FactRow label="Region" a={ca.subregion || ca.region} b={cb.subregion || cb.region} />
            <FactRow label="Languages" a={shortList(ca.languages)} b={shortList(cb.languages)} />
            <FactRow label="Currency" a={shortList(ca.currencies, 1)} b={shortList(cb.currencies, 1)} />
            <FactRow
              label="Neighbours"
              a={ca.borders.length ? `${ca.borders.length}` : "None (island)"}
              b={cb.borders.length ? `${cb.borders.length}` : "None (island)"}
            />
            <FactRow label="Coastline" a={ca.landlocked ? "Landlocked" : "Yes"} b={cb.landlocked ? "Landlocked" : "Yes"} />
          </section>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onShowCountry(ca.code)}
              className="truncate rounded-lg bg-white px-2 py-1.5 text-xs font-bold text-brand-blue shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              {ca.name} ›
            </button>
            <button
              type="button"
              onClick={() => onShowCountry(cb.code)}
              className="truncate rounded-lg bg-white px-2 py-1.5 text-xs font-bold text-orange-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              {cb.name} ›
            </button>
            <button
              type="button"
              onClick={share}
              className="rounded-lg bg-brand-blue px-2 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-navy"
            >
              {copied ? "✓ Copied" : "🔗 Share"}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400">
            Data: World Bank Open Data (latest year available, shown as ’yy) · country facts: mledoze/countries
          </p>
        </>
      )}
    </div>
  );
}

function Slot({
  tone,
  country,
  countries,
  exclude,
  onPick,
}: {
  tone: "a" | "b";
  country: WorldCountry | undefined;
  countries: WorldCountry[];
  exclude: string | null;
  onPick: (code: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 shrink-0 rounded-full ${TONE[tone].dot}`} aria-hidden />
      <div className="min-w-0 flex-1">
        {country ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
            <CountryFlag country={country} className="h-5 w-7" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
              {country.name} <span className="text-xs font-normal text-slate-400">{country.nameZh}</span>
            </span>
            <button
              type="button"
              onClick={() => onPick(null)}
              aria-label={`Clear ${country.name}`}
              className="rounded-full px-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <CountryPicker
            countries={countries}
            exclude={exclude ? new Set([exclude]) : undefined}
            placeholder={tone === "a" ? "First country · 第一个国家" : "Second country · 第二个国家"}
            onPick={(c) => onPick(c.code)}
          />
        )}
      </div>
    </div>
  );
}

function FactRow({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-t border-slate-100 px-3 py-1.5 first:border-0">
      <span className="break-words text-right font-semibold text-slate-700">{a}</span>
      <span className="whitespace-nowrap text-[10px] font-bold uppercase text-slate-400">{label}</span>
      <span className="break-words font-semibold text-slate-700">{b}</span>
    </div>
  );
}

function shortList(items: string[], max = 2): string {
  if (!items.length) return "—";
  return items.length > max ? `${items.slice(0, max).join(", ")} +${items.length - max}` : items.join(", ");
}

const times = (r: number) => (r >= 10 ? r.toFixed(0) : r.toFixed(1));

/** Plain-language highlights generated from the data. */
function Nutshell({ a, b }: { a: WorldCountry; b: WorldCountry }) {
  const lines: string[] = [];
  if (a.borders.includes(b.code)) {
    lines.push(`🤝 ${a.name} and ${b.name} share a border.`);
  } else {
    const km = Math.round(distanceKm(a.lat, a.lng, b.lat, b.lng) / 100) * 100;
    lines.push(`📏 About ${km > 0 ? km.toLocaleString("en-US") : "less than 100"} km apart (centre to centre).`);
  }

  const cmp = (va: number | undefined, vb: number | undefined, make: (big: WorldCountry, small: WorldCountry, r: number) => string, same: string) => {
    if (!va || !vb) return;
    const r = Math.max(va, vb) / Math.min(va, vb);
    if (r < 1.1) lines.push(same);
    else lines.push(va > vb ? make(a, b, r) : make(b, a, r));
  };
  cmp(a.area ?? undefined, b.area ?? undefined, (big, small, r) => `📐 ${big.name} is ${times(r)}× the size of ${small.name}.`, `📐 They're about the same size.`);
  cmp(a.population?.[0], b.population?.[0], (big, small, r) => `👥 ${big.name} has ${times(r)}× as many people as ${small.name}.`, `👥 They have about the same population.`);
  cmp(a.gdpPerCapita?.[0], b.gdpPerCapita?.[0], (big, small, r) => `💵 ${big.name}'s economy produces ${times(r)}× more per person than ${small.name}'s.`, `💵 Their economic output per person is similar.`);
  if (a.lifeExpectancy && b.lifeExpectancy) {
    const d = a.lifeExpectancy[0] - b.lifeExpectancy[0];
    if (Math.abs(d) >= 1) lines.push(`❤️ People in ${d > 0 ? a.name : b.name} live about ${Math.abs(d).toFixed(1)} years longer on average.`);
  }

  return (
    <section className="rounded-xl border border-brand-gold/50 bg-brand-gold/10 p-3">
      <p className="text-xs font-bold text-brand-navy">💡 In a nutshell</p>
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
