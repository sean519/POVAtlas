import { useEffect, useState } from "react";
import type { EventTeam, SportEvent } from "../types";

/**
 * Sports events (generated from Wikipedia). Loaded on demand — import these
 * helpers, never `data/events` directly from eagerly loaded code.
 */

let eventsPromise: Promise<SportEvent[]> | null = null;

export function loadEvents(): Promise<SportEvent[]> {
  eventsPromise ??= import("../data/events").then((m) => m.SPORT_EVENTS);
  eventsPromise.catch(() => (eventsPromise = null));
  return eventsPromise;
}

/** The events once loaded (null before, or while `enabled` is false). */
export function useEvents(enabled = true): SportEvent[] | null {
  const [events, setEvents] = useState<SportEvent[] | null>(null);
  useEffect(() => {
    if (!enabled || events) return;
    let cancelled = false;
    loadEvents()
      .then((e) => !cancelled && setEvents(e))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, events]);
  return events;
}

/** Today's local date, ISO. */
export function todayIso(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const DAY = 86_400_000;
const dayDiff = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / DAY);

export interface EventStatus {
  state: "upcoming" | "live" | "finished";
  label: string;
}

export function eventStatus(ev: SportEvent, today = todayIso()): EventStatus {
  if (today < ev.start) {
    const d = dayDiff(ev.start, today);
    return { state: "upcoming", label: d === 1 ? "Starts tomorrow" : `Starts in ${d} days` };
  }
  if (today <= ev.end) {
    return { state: "live", label: `Day ${dayDiff(today, ev.start) + 1} of ${dayDiff(ev.end, ev.start) + 1}` };
  }
  return { state: "finished", label: "Finished" };
}

/**
 * Display order: live, then just finished (≤45 days), then upcoming (soonest
 * first), then older events (most recent first).
 */
export function orderEvents(events: SportEvent[], today = todayIso()): SportEvent[] {
  const bucket = (ev: SportEvent) => {
    const s = eventStatus(ev, today).state;
    if (s === "live") return 0;
    if (s === "finished" && dayDiff(today, ev.end) <= 45) return 1;
    if (s === "upcoming") return 2;
    return 3;
  };
  return [...events].sort((a, b) => {
    const ba = bucket(a);
    const bb = bucket(b);
    if (ba !== bb) return ba - bb;
    return ba === 2 ? a.start.localeCompare(b.start) : b.end.localeCompare(a.end);
  });
}

/** Every team at the event (any kind). */
export function eventTeams(ev: SportEvent): EventTeam[] {
  return (
    ev.groups?.flatMap((g) => g.teams) ??
    ev.ranking?.map((r) => r.team) ??
    ev.medals?.map((m) => m.team) ??
    []
  );
}

/** Distinct Atlas countries/regions taking part. */
export function eventCountries(ev: SportEvent): string[] {
  return [...new Set(eventTeams(ev).map((t) => t.atlas).filter((a): a is string => Boolean(a)))];
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

const PLACE_ICON: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

/** How a country took part in an event — one line per team (UK can have several). */
export function participationFor(ev: SportEvent, atlas: string): { team: EventTeam; detail: string }[] {
  const out: { team: EventTeam; detail: string }[] = [];
  for (const g of ev.groups ?? []) {
    for (const t of g.teams) {
      if (t.atlas !== atlas) continue;
      const others = g.teams.filter((o) => o !== t).map((o) => o.name);
      out.push({
        team: t,
        detail:
          ev.groupLabel === "Pool"
            ? `${g.name} · with ${others.join(", ")}`
            : `Qualified via ${g.name}`,
      });
    }
  }
  for (const r of ev.ranking ?? []) {
    if (r.team.atlas === atlas) out.push({ team: r.team, detail: `${PLACE_ICON[r.rank] ?? ""} Finished ${ordinal(r.rank)}`.trim() });
  }
  for (const m of ev.medals ?? []) {
    if (m.team.atlas === atlas) {
      out.push({
        team: m.team,
        detail: `${m.rank ? `${ordinal(m.rank)} in the medal table` : "Outside the official table"} · 🥇${m.gold} 🥈${m.silver} 🥉${m.bronze}`,
      });
    }
  }
  return out;
}
