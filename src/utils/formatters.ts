// Number / data formatting helpers used across the app.

/**
 * Format a population count with thousands separators.
 * e.g. 331000000 -> "331,000,000"
 */
export function formatPopulation(value: number): string {
  return value.toLocaleString("en-US");
}

/**
 * Format a large USD amount in compact form.
 * e.g. 27300000000000 -> "$27.3T", 1790000000000 -> "$1.79T",
 *      405000000000 -> "$405B", 2600000000 -> "$2.6B"
 */
export function formatGDP(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) {
    return `$${trimNumber(value / 1e12)}T`;
  }
  if (abs >= 1e9) {
    return `$${trimNumber(value / 1e9)}B`;
  }
  if (abs >= 1e6) {
    return `$${trimNumber(value / 1e6)}M`;
  }
  return `$${value.toLocaleString("en-US")}`;
}

/**
 * Format a per-capita USD value with a dollar sign and separators.
 * e.g. 82000 -> "$82,000"
 */
export function formatPerCapita(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/**
 * Format an area in km² in compact form.
 * e.g. 9800000 -> "9.8M km²", 505990 -> "505,990 km²"
 */
export function formatArea(value: number): string {
  if (value >= 1e6) {
    return `${trimNumber(value / 1e6)}M km²`;
  }
  return `${value.toLocaleString("en-US")} km²`;
}

/**
 * Format an ISO date string into a friendly long date.
 * e.g. "2026-06-11" -> "Thursday, June 11, 2026"
 */
export function formatLongDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Short date for compact UI.
 * e.g. "2026-06-11" -> "Jun 11"
 */
export function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Default timezone label shown next to every kickoff time. All kickoff times in
 * the schedule are expressed in this zone (US Pacific / PST). Change this one
 * constant to re-label the whole schedule.
 */
export const KICKOFF_TZ = "PST";

/**
 * Format a kickoff time with its timezone label.
 * e.g. "19:00" -> "19:00 PST"
 */
export function formatKickoff(time: string): string {
  return `${time} ${KICKOFF_TZ}`;
}

/** Today's date as a local "YYYY-MM-DD" string. */
export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Round to at most 2 significant decimals and drop trailing zeros. */
function trimNumber(n: number): string {
  const rounded = n >= 100 ? Math.round(n) : Math.round(n * 100) / 100;
  return rounded.toString();
}
