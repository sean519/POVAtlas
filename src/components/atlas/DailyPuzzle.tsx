import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { WorldCountry } from "../../types";
import { findFeature, loadGeo } from "../../utils/geo";
import { bearingDeg, distanceKm, type WorldData } from "../../utils/world";
import {
  MAX_GUESSES,
  currentStreak,
  gameFor,
  msUntilNextPuzzle,
  puzzleAnswer,
  puzzleNumber,
  recordGuess,
  useDaily,
} from "../../utils/daily";
import CountryShape from "./CountryShape";
import CountryPicker from "./CountryPicker";
import CountryFlag from "./CountryFlag";

const ARROWS = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"];
/** Half the Earth's circumference — the farthest two places can be. */
const MAX_KM = 20_000;

interface GuessInfo {
  country: WorldCountry;
  correct: boolean;
  km: number;
  arrow: string;
  /** 0–100: how close the guess is. */
  proximity: number;
  neighbour: boolean;
}

function describeGuess(guess: WorldCountry, answer: WorldCountry): GuessInfo {
  const correct = guess.code === answer.code;
  const km = correct ? 0 : distanceKm(guess.lat, guess.lng, answer.lat, answer.lng);
  const b = bearingDeg(guess.lat, guess.lng, answer.lat, answer.lng);
  return {
    country: guess,
    correct,
    km,
    arrow: correct ? "🎉" : ARROWS[Math.round(b / 45) % 8],
    proximity: correct ? 100 : Math.max(0, Math.round((1 - km / MAX_KM) * 100)),
    neighbour: answer.borders.includes(guess.code),
  };
}

function square(g: GuessInfo): string {
  if (g.correct) return "🟩";
  if (g.proximity >= 80) return "🟨";
  if (g.proximity >= 50) return "🟧";
  return "🟥";
}

/**
 * 🧩 Daily Country: guess today's country from its silhouette in 6 tries.
 * Each miss shows distance, direction and closeness; hints unlock as you go.
 */
export default function DailyPuzzle({
  world,
  onShowCountry,
}: {
  world: WorldData;
  onShowCountry: (code: string) => void;
}) {
  const [puzzle, setPuzzle] = useState(() => puzzleNumber());
  const saved = useDaily();
  const game = gameFor(saved, puzzle);
  const answer = world.byCode.get(puzzleAnswer(world.puzzlePool, puzzle));

  // Silhouette comes from the map's (already cached) border data.
  const [feature, setFeature] = useState<GeoJSON.Feature | null>(null);
  useEffect(() => {
    if (!answer) return;
    let cancelled = false;
    loadGeo()
      .then((geo) => !cancelled && setFeature(findFeature(geo, answer.code) ?? null))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [answer]);

  // Countdown to the next puzzle; rolls over to it at local midnight.
  const [msLeft, setMsLeft] = useState(() => msUntilNextPuzzle());
  useEffect(() => {
    const t = window.setInterval(() => {
      setMsLeft(msUntilNextPuzzle());
      const n = puzzleNumber();
      if (n !== puzzle) setPuzzle(n);
    }, 1000);
    return () => window.clearInterval(t);
  }, [puzzle]);

  const guesses = useMemo(
    () =>
      answer
        ? game.guesses
            .map((code) => world.byCode.get(code))
            .filter((c): c is WorldCountry => Boolean(c))
            .map((c) => describeGuess(c, answer))
        : [],
    [game.guesses, answer, world.byCode]
  );
  const guessed = useMemo(() => new Set(game.guesses), [game.guesses]);
  const [copied, setCopied] = useState(false);

  if (!answer) return null;
  const wrong = guesses.filter((g) => !g.correct).length;
  const streak = currentStreak(saved.stats, puzzle);

  const share = async () => {
    const lines = guesses.map((g) => `${square(g)}${g.arrow}`);
    const text = `POV Atlas 🌍 Daily #${puzzle} ${game.won ? guesses.length : "X"}/${MAX_GUESSES}\n${lines.join("\n")}\nhttps://povatlas.com`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // share sheet dismissed / clipboard blocked — nothing to do
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-brand-navy">
          🧩 Daily Country <span className="font-semibold text-slate-400">· 每日猜国家 #{puzzle}</span>
        </h3>
        {streak > 0 && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-600" title="Win streak">
            🔥 {streak}
          </span>
        )}
      </div>

      {/* Silhouette */}
      <div className="mt-2 rounded-xl bg-gradient-to-b from-sky-50 to-slate-50 p-3">
        {feature ? (
          <CountryShape
            feature={feature}
            className="h-40 w-full"
            fill={game.done ? (game.won ? "#2f9e74" : "#dc6b5b") : "#3a4a73"}
          />
        ) : (
          <div className="h-40 animate-pulse rounded-lg bg-slate-200/60" />
        )}
      </div>

      {/* Hints */}
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
        <Hint unlocked={wrong >= 2 || game.done} lockedLabel="Region · after 2 guesses">
          📍 {answer.subregion || answer.region}
        </Hint>
        <Hint unlocked={wrong >= 4 || game.done} lockedLabel="Capital · after 4 guesses">
          🏙️ Capital starts with “{(answer.capital || "?").charAt(0)}”
        </Hint>
      </div>

      {/* Guesses */}
      <ol className="mt-3 space-y-1">
        {guesses.map((g) => (
          <li
            key={g.country.code}
            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm ${
              g.correct ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
            }`}
          >
            <CountryFlag country={g.country} className="h-4 w-6" />
            <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">
              {g.country.name}
              {g.neighbour && !g.correct && (
                <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-700">neighbour!</span>
              )}
            </span>
            {!g.correct && (
              <span className="shrink-0 text-xs tabular-nums text-slate-500">
                {Math.round(g.km).toLocaleString("en-US")} km
              </span>
            )}
            <span className="shrink-0 text-base leading-none" aria-label="direction">
              {g.arrow}
            </span>
            <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-brand-blue">
              {g.proximity}%
            </span>
          </li>
        ))}
        {!game.done &&
          Array.from({ length: MAX_GUESSES - guesses.length }).map((_, i) => (
            <li key={`empty-${i}`} className="h-[34px] rounded-lg border border-dashed border-slate-200" />
          ))}
      </ol>

      {!game.done ? (
        <div className="mt-3">
          <CountryPicker
            countries={world.countries}
            exclude={guessed}
            placeholder={`Guess ${guesses.length + 1} of ${MAX_GUESSES} · 输入国家名`}
            onPick={(c) => recordGuess(puzzle, c.code, answer.code)}
          />
          <p className="mt-1.5 text-[11px] text-slate-400">
            Each miss shows how far away the answer is, which way to go, and how close you were.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className={`rounded-xl p-3 ${game.won ? "bg-emerald-50" : "bg-rose-50"}`}>
            <p className="text-sm font-bold text-slate-700">
              {game.won
                ? `🎉 Got it in ${guesses.length}! 答对了!`
                : "😅 Not this time — the answer was:"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <CountryFlag country={answer} className="h-8 w-11" />
              <div className="min-w-0">
                <p className="truncate font-extrabold text-brand-navy">{answer.name}</p>
                <p className="text-xs text-slate-500">
                  {answer.nameZh}
                  {answer.capital ? ` · Capital ${answer.capital}` : ""}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onShowCountry(answer.code)}
                className="rounded-lg bg-white px-2 py-1.5 text-xs font-bold text-brand-blue shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                🗺️ See it on the map
              </button>
              <button
                type="button"
                onClick={share}
                className="rounded-lg bg-brand-blue px-2 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-navy"
              >
                {copied ? "✓ Copied!" : "📤 Share result"}
              </button>
            </div>
          </div>
          <Stats stats={saved.stats} streak={streak} todayGuesses={game.won ? guesses.length : null} />
          <p className="text-center text-xs text-slate-500">
            ⏰ Next country in <span className="font-bold tabular-nums text-brand-navy">{formatCountdown(msLeft)}</span>
          </p>
        </div>
      )}
    </section>
  );
}

function Hint({
  unlocked,
  lockedLabel,
  children,
}: {
  unlocked: boolean;
  lockedLabel: string;
  children: ReactNode;
}) {
  return unlocked ? (
    <span className="rounded-full bg-brand-sky/15 px-2 py-0.5 font-semibold text-brand-navy">{children}</span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-400">🔒 {lockedLabel}</span>
  );
}

function Stats({
  stats,
  streak,
  todayGuesses,
}: {
  stats: ReturnType<typeof useDaily>["stats"];
  streak: number;
  todayGuesses: number | null;
}) {
  const winPct = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  const maxBar = Math.max(1, ...stats.dist);
  const tiles = [
    { label: "Played", value: stats.played },
    { label: "Win %", value: winPct },
    { label: "Streak", value: streak },
    { label: "Best", value: stats.maxStreak },
  ];
  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg bg-slate-50 py-1.5">
            <div className="text-lg font-extrabold text-brand-navy">{t.value}</div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400">{t.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-0.5">
        {stats.dist.map((n, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 text-slate-400">{i + 1}</span>
            <div
              className={`rounded px-1.5 text-right font-bold text-white ${
                todayGuesses === i + 1 ? "bg-emerald-500" : "bg-slate-400"
              }`}
              style={{ width: `${Math.max(8, (n / maxBar) * 100)}%` }}
            >
              {n}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
