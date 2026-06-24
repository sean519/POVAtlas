import { useEffect, useState, type ReactNode } from "react";
import Footer from "./Footer";
import { formatLongDate, formatShortDate, todayISO } from "../utils/formatters";

interface LayoutProps {
  schedule: ReactNode;
  map: ReactNode;
  /** Increment to ask the mobile view to jump to the Map tab. */
  focusMapSignal: number;
}

type MobileTab = "schedule" | "map";

export default function Layout({
  schedule,
  map,
  focusMapSignal,
}: LayoutProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("schedule");

  // When the app selects a team / match, surface the map (where the info card lives).
  useEffect(() => {
    if (focusMapSignal > 0) setMobileTab("map");
  }, [focusMapSignal]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {/* Header */}
      <header className="z-20 bg-gradient-to-r from-brand-blue via-brand-lilac to-brand-peach text-white shadow-lg [text-shadow:0_1px_2px_rgba(0,0,0,0.18)]">
        <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/25 text-xl shadow-inner sm:h-11 sm:w-11 sm:text-2xl"
              aria-hidden
            >
              🌍
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold leading-tight sm:text-xl">
                World Cup Geography Map ⚽
              </h1>
              <p className="hidden text-xs text-white/90 sm:block sm:text-sm">
                Learn where every World Cup team is on the map.
              </p>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1.5 text-[11px] font-semibold shadow-inner sm:gap-2 sm:px-3 sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            <span className="sm:hidden">{formatShortDate(todayISO())}</span>
            <span className="hidden sm:inline">
              Today · {formatLongDate(todayISO())}
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Schedule (left) */}
        <aside
          className={[
            "h-full min-h-0 w-full border-slate-200 bg-white lg:w-[380px] lg:shrink-0 lg:border-r",
            "lg:flex lg:flex-col",
            mobileTab === "schedule" ? "flex flex-col" : "hidden",
            "lg:!flex",
          ].join(" ")}
        >
          {schedule}
        </aside>

        {/* Map (center) — holds the floating info card in its bottom-right */}
        <main
          className={[
            "relative min-h-0 flex-1",
            mobileTab === "map" ? "block" : "hidden",
            "lg:!block",
          ].join(" ")}
        >
          <div className="h-full w-full">{map}</div>
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav className="sticky bottom-0 z-20 flex border-t border-slate-200 bg-white lg:hidden">
        {(["schedule", "map"] as MobileTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={[
              "flex-1 py-2.5 text-center text-xs font-bold transition",
              mobileTab === tab
                ? "bg-brand-blue/10 text-brand-blue"
                : "text-slate-500",
            ].join(" ")}
          >
            <span className="mr-1" aria-hidden>
              {tab === "schedule" ? "📋" : "🗺️"}
            </span>
            {tab === "schedule" ? "Browse" : "Map"}
          </button>
        ))}
      </nav>

      <Footer />
    </div>
  );
}
