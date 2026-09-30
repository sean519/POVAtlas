import { useWorldData } from "../../utils/world";
import DailyPuzzle from "./DailyPuzzle";
import CountryOfWeek from "./CountryOfWeek";
import CompareView from "./CompareView";
import CountryList from "./CountryList";

export type AtlasTab = "today" | "compare" | "countries";

const TABS: { id: AtlasTab; label: string; icon: string }[] = [
  { id: "today", label: "Today", icon: "🧩" },
  { id: "compare", label: "Compare", icon: "⚖️" },
  { id: "countries", label: "Countries", icon: "🌐" },
];

/** The Atlas section of the left panel: daily puzzle, compare, all countries. */
export default function AtlasPanel({
  tab,
  onTabChange,
  compareA,
  compareB,
  onCompareChange,
  selectedCode,
  onShowCountry,
  onCompare,
}: {
  tab: AtlasTab;
  onTabChange: (t: AtlasTab) => void;
  compareA: string | null;
  compareB: string | null;
  onCompareChange: (a: string | null, b: string | null) => void;
  selectedCode: string | null;
  onShowCountry: (code: string) => void;
  onCompare: (code: string) => void;
}) {
  const world = useWorldData();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-3 gap-1 border-b border-slate-200 bg-slate-50 px-1.5 py-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={[
              "flex items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-xs font-bold transition",
              tab === t.id
                ? "bg-white text-brand-blue shadow ring-1 ring-brand-sky/40"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
            ].join(" ")}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="nice-scroll flex-1 overflow-y-auto p-3">
        {!world ? (
          <div className="space-y-3">
            <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : tab === "today" ? (
          <div className="space-y-4">
            <DailyPuzzle world={world} onShowCountry={onShowCountry} />
            <CountryOfWeek world={world} onShowCountry={onShowCountry} onCompare={onCompare} />
          </div>
        ) : tab === "compare" ? (
          <CompareView
            world={world}
            a={compareA}
            b={compareB}
            onChange={onCompareChange}
            onShowCountry={onShowCountry}
          />
        ) : (
          <CountryList world={world} selectedCode={selectedCode} onShowCountry={onShowCountry} />
        )}
      </div>
    </div>
  );
}
