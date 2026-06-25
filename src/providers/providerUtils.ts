/** YYYY-MM-DD (UTC) for today plus an optional whole-day offset. */
export function utcDate(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}
