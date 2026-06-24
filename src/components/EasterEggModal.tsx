import { useEffect, useRef, useState } from "react";
import {
  OC_ADULTS,
  OC_HQ,
  OC_KIDS,
  type EggMember,
} from "../data/easterEgg";

interface EasterEggModalProps {
  open: boolean;
  onClose: () => void;
}

const CONFETTI = ["🎉", "⚽", "⭐", "🎊", "🏡", "🥳"];

/** Playful full-screen surprise for the hidden OC居委会 easter egg. */
export default function EasterEggModal({ open, onClose }: EasterEggModalProps) {
  const [cheer, setCheer] = useState<{ name: string; text: string; id: number } | null>(null);
  const [waving, setWaving] = useState(false);
  const [zoomed, setZoomed] = useState<EggMember | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setCheer(null);
      setWaving(false);
      setZoomed(null);
    }
  }, [open]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!open) return null;

  const rollCheer = (m: EggMember) => {
    const text = m.cheers[Math.floor(Math.random() * m.cheers.length)];
    setCheer({ name: m.name, text, id: Date.now() });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCheer(null), 1300);
  };

  // Tapping a member opens an enlarged portrait so the avatar is clearly visible.
  const onMemberClick = (m: EggMember) => {
    setZoomed(m);
    rollCheer(m);
  };

  const doWave = () => {
    setWaving(false);
    // restart the animation on next frame
    requestAnimationFrame(() => requestAnimationFrame(() => setWaving(true)));
    window.setTimeout(() => setWaving(false), 1400);
  };

  const renderRow = (members: EggMember[], offset: number) => (
    <div className="grid grid-cols-3 gap-2">
      {members.map((m, i) => (
        <button
          key={m.name}
          type="button"
          onClick={() => onMemberClick(m)}
          className="relative flex flex-col items-center gap-1 rounded-2xl bg-slate-50 py-3 transition hover:bg-brand-sky/10"
        >
          {m.avatarUrl ? (
            <span
              className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-white shadow-sm"
              style={{
                aspectRatio: "1 / 1",
                ...(waving
                  ? { animation: "egg-bounce 0.6s ease", animationDelay: `${(offset + i) * 0.06}s` }
                  : {}),
              }}
            >
              <img
                src={m.avatarUrl}
                className="h-full w-full object-cover"
                alt={m.name}
                draggable={false}
              />
              <span className="pointer-events-none absolute bottom-0 right-0 rounded-full bg-brand-navy/80 px-1 text-[9px] leading-4 text-white shadow">
                🔍
              </span>
            </span>
          ) : (
            <span
              className="text-4xl"
              style={
                waving
                  ? { animation: "egg-bounce 0.6s ease", animationDelay: `${(offset + i) * 0.06}s` }
                  : undefined
              }
              aria-hidden
            >
              {m.emoji}
            </span>
          )}
          <span className="text-[11px] font-semibold text-slate-600">
            {m.name}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-brand-navy/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="egg-confetti absolute"
            style={{
              left: `${(i * 4.9) % 100}%`,
              animationDelay: `${(i % 7) * 0.3}s`,
              fontSize: `${12 + (i % 4) * 5}px`,
            }}
          >
            {CONFETTI[i % CONFETTI.length]}
          </span>
        ))}
      </div>

      {/* Card */}
      <div className="animate-fade-in-up relative z-10 max-h-[calc(100%-2rem)] w-[min(28rem,calc(100%-1rem))] overflow-y-auto rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-brand-navy">
              🏡 {OC_HQ.title}
            </h2>
            <p className="text-sm text-brand-peach">{OC_HQ.subtitle}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Orange County, California
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-500 transition hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <section className="mt-4">
          <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-blue">
            成年组 · 6
          </h3>
          {renderRow(OC_ADULTS, 0)}
        </section>

        <section className="mt-4">
          <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-blue">
            少年组 · 6
          </h3>
          {renderRow(OC_KIDS, 6)}
        </section>

        <p className="mt-3 text-center text-[11px] text-slate-400">
          点头像放大看看，再点一下听他们欢呼 ⚽
        </p>
        <button
          type="button"
          onClick={doWave}
          className="mt-2 w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white transition hover:bg-brand-navy"
        >
          全体欢呼 🎉
        </button>
      </div>

      {/* Enlarged portrait — tap a member to see them up close */}
      {zoomed && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center p-4"
          onClick={() => setZoomed(null)}
        >
          <div className="absolute inset-0 bg-brand-navy/70 backdrop-blur-md" />
          <div
            className="animate-fade-in-up relative z-10 flex w-[min(20rem,calc(100%-2rem))] flex-col items-center rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomed(null)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-500 transition hover:bg-slate-200"
            >
              ✕
            </button>

            {cheer?.name === zoomed.name && (
              <span
                key={cheer.id}
                className="egg-pop absolute -top-3 z-20 whitespace-nowrap rounded-full bg-brand-navy px-3 py-1 text-sm font-bold text-white shadow"
              >
                {cheer.text}
              </span>
            )}

            <button
              type="button"
              onClick={() => rollCheer(zoomed)}
              className="active:scale-95 transition"
              aria-label={`${zoomed.name} cheer`}
            >
              {zoomed.avatarUrl ? (
                <span
                  className="block h-56 w-56 overflow-hidden rounded-full bg-white ring-4 ring-brand-sky/40 shadow-lg"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <img
                    src={zoomed.avatarUrl}
                    className="h-full w-full object-cover"
                    alt={zoomed.name}
                    draggable={false}
                  />
                </span>
              ) : (
                <span
                  className="flex h-56 w-56 items-center justify-center rounded-full bg-slate-50 text-8xl ring-4 ring-brand-sky/40 shadow-lg"
                  aria-hidden
                >
                  {zoomed.emoji}
                </span>
              )}
            </button>

            <h3 className="mt-4 text-2xl font-extrabold text-brand-navy">
              {zoomed.name}
            </h3>
            <p className="mt-1 text-center text-xs text-slate-400">
              点头像换个口号 · 点空白处关闭
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
