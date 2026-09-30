import { useSyncExternalStore } from "react";

/**
 * Daily puzzle + Country of the Week scheduling, and the puzzle's per-viewer
 * progress/stats (kept in localStorage — no accounts). Everyone gets the same
 * puzzle on the same local calendar day.
 */

const DAY_MS = 86_400_000;
/** Puzzle #1 is 2026-09-30. */
const PUZZLE_EPOCH = Date.UTC(2026, 8, 30);
/** Country of the Week rotates every Monday, starting Monday 2026-09-28. */
const WEEK_EPOCH = Date.UTC(2026, 8, 28);

export const MAX_GUESSES = 6;

/** The viewer's local calendar date as a UTC timestamp at midnight. */
function localDayUtc(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Today's puzzle number (1-based). */
export function puzzleNumber(d = new Date()): number {
  return Math.max(1, Math.round((localDayUtc(d) - PUZZLE_EPOCH) / DAY_MS) + 1);
}

/** Milliseconds until the next local midnight (next puzzle). */
export function msUntilNextPuzzle(d = new Date()): number {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return next.getTime() - d.getTime();
}

/** Deterministic PRNG so every visitor gets the same order. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededOrder(items: string[], seed: number): string[] {
  const a = [...items].sort();
  const rnd = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The answer (country code) for puzzle #n — no repeats until the pool cycles. */
export function puzzleAnswer(pool: string[], n: number): string {
  const order = seededOrder(pool, 20260930);
  return order[(n - 1) % order.length];
}

/* ---------------- Country of the Week ---------------- */

export function weekIndex(d = new Date()): number {
  return Math.max(0, Math.floor((localDayUtc(d) - WEEK_EPOCH) / (7 * DAY_MS)));
}

/** Monday (start) and Sunday (end) of week `idx`, as ISO dates. */
export function weekRange(idx: number): { start: string; end: string } {
  const start = new Date(WEEK_EPOCH + idx * 7 * DAY_MS);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function countryOfWeek(codes: string[], idx: number): string {
  const order = seededOrder(codes, 20260928);
  return order[idx % order.length];
}

/** Whole days until next Monday's new country (1–7). */
export function daysUntilNextWeek(d = new Date()): number {
  const daysIn = Math.round((localDayUtc(d) - WEEK_EPOCH) / DAY_MS);
  return 7 - (((daysIn % 7) + 7) % 7);
}

/* ---------------- Puzzle progress + stats (localStorage) ---------------- */

export interface DailyGame {
  puzzle: number;
  guesses: string[];
  done: boolean;
  won: boolean;
}

export interface DailyStats {
  played: number;
  won: number;
  /** Consecutive wins ending at `lastWon`. */
  streak: number;
  maxStreak: number;
  /** Wins by number of guesses (index 0 = first guess). */
  dist: number[];
  lastWon: number | null;
}

interface Saved {
  game: DailyGame | null;
  stats: DailyStats;
}

const KEY = "povatlas.daily.v1";
const EMPTY_STATS: DailyStats = {
  played: 0,
  won: 0,
  streak: 0,
  maxStreak: 0,
  dist: Array(MAX_GUESSES).fill(0),
  lastWon: null,
};

function read(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Saved;
      if (s && s.stats && Array.isArray(s.stats.dist)) return s;
    }
  } catch {
    // private mode / blocked storage — play without saving
  }
  return { game: null, stats: { ...EMPTY_STATS, dist: [...EMPTY_STATS.dist] } };
}

let snapshot: Saved = read();
const listeners = new Set<() => void>();

function write(next: Saved) {
  snapshot = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore — state still lives in memory for this visit
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const getSnapshot = () => snapshot;

/** Reactive puzzle progress + stats, shared by the puzzle and the header. */
export function useDaily(): Saved {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** Today's game (fresh if the saved one is from another day). */
export function gameFor(saved: Saved, puzzle: number): DailyGame {
  return saved.game?.puzzle === puzzle
    ? saved.game
    : { puzzle, guesses: [], done: false, won: false };
}

/** Streak as shown today: a missed day breaks it. */
export function currentStreak(stats: DailyStats, puzzle: number): number {
  return stats.lastWon !== null && stats.lastWon >= puzzle - 1 ? stats.streak : 0;
}

/** Record a guess for today's puzzle and update stats when the game ends. */
export function recordGuess(puzzle: number, guess: string, answer: string): void {
  const saved = snapshot;
  const game = gameFor(saved, puzzle);
  if (game.done || game.guesses.includes(guess)) return;
  const guesses = [...game.guesses, guess];
  const won = guess === answer;
  const done = won || guesses.length >= MAX_GUESSES;
  const stats: DailyStats = { ...saved.stats, dist: [...saved.stats.dist] };
  if (done) {
    stats.played += 1;
    if (won) {
      stats.won += 1;
      stats.streak = stats.lastWon === puzzle - 1 ? stats.streak + 1 : 1;
      stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
      stats.dist[guesses.length - 1] += 1;
      stats.lastWon = puzzle;
    } else {
      stats.streak = 0;
    }
  }
  write({ game: { puzzle, guesses, done, won }, stats });
}
