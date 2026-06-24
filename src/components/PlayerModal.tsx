import type { StarPlayer, Team } from "../types";
import Flag from "./Flag";

interface PlayerModalProps {
  team: Team | null;
  player: StarPlayer | null;
  onClose: () => void;
  onViewCountry: (code: string) => void;
}

/** Full-screen card with a player's bio + light buzz. */
export default function PlayerModal({
  team,
  player,
  onClose,
  onViewCountry,
}: PlayerModalProps) {
  if (!team || !player) return null;

  const facts: { label: string; value: string }[] = [];
  if (player.age != null) facts.push({ label: "Age", value: `${player.age}` });
  if (player.marital) facts.push({ label: "Status", value: player.marital });
  if (player.children != null)
    facts.push({ label: "Children", value: `${player.children}` });
  facts.push({ label: "Position", value: player.position });

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-brand-navy/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-fade-in-up relative z-10 max-h-[88%] w-full overflow-y-auto rounded-t-3xl bg-white shadow-card ring-1 ring-black/10 sm:max-h-[calc(100%-2rem)] sm:w-[min(30rem,100%)] sm:rounded-3xl">
        {/* Header */}
        <div className="relative bg-brand-navy p-4 text-white">
          <div className="flex items-start gap-3">
            <Flag team={team} className="h-11 w-16 ring-2 ring-white/40" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-extrabold leading-tight">
                {player.name}
              </h2>
              <p className="truncate text-sm text-white/75">
                {team.teamName} · {team.nameZh}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-md bg-brand-gold/90 px-1.5 py-0.5 font-bold text-brand-navy">
                  ⭐ Fame {player.fame}
                </span>
                <span className="rounded-md bg-white/15 px-1.5 py-0.5">
                  {player.position}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-lg leading-none text-white/80 transition hover:bg-white/25"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Bio chips */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {facts.map((f) => (
              <div
                key={f.label}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-center"
              >
                <div className="truncate text-sm font-bold text-brand-navy">
                  {f.value}
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {f.label}
                </div>
              </div>
            ))}
          </div>

          {/* Short intro */}
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {player.note}
          </p>

          {/* Buzz */}
          {player.buzz && player.buzz.length > 0 && (
            <section className="mt-4">
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-blue">
                📰 Latest buzz
              </h3>
              <ul className="space-y-1.5">
                {player.buzz.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span aria-hidden>•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!player.age && !player.buzz && (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
              More details on this player coming soon.
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              onViewCountry(team.fifaCode);
              onClose();
            }}
            className="mt-4 w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white transition hover:bg-brand-navy"
          >
            View {team.teamName} on the map →
          </button>

          <p className="mt-2 text-center text-[10px] text-slate-400">
            Bio is approximate; buzz lines are light & illustrative, not verified
            news.
          </p>
        </div>
      </div>
    </div>
  );
}
