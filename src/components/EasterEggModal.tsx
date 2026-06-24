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
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setCheer(null);
      setWaving(false);
    }
  }, [open]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!open) return null;

  const onMemberClick = (m: EggMember) => {
    const text = m.cheers[Math.floor(Math.random() * m.cheers.length)];
    setCheer({ name: m.name, text, id: Date.now() });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCheer(null), 1300);
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
          {cheer?.name === m.name && (
            <span
              key={cheer.id}
              className="egg-pop absolute -top-3 z-10 whitespace-nowrap rounded-full bg-brand-navy px-2 py-0.5 text-[11px] font-bold text-white shadow"
            >
              {cheer.text}
            </span>
          )}
          {m.avatarSvg ? (
            <img
              src={`data:image/svg+xml,${encodeURIComponent(m.avatarSvg)}`}
              className="h-14 w-14 rounded-full"
              alt=""
              aria-hidden
              style={
                waving
                  ? { animation: "egg-bounce 0.6s ease", animationDelay: `${(offset + i) * 0.06}s` }
                  : undefined
              }
            />
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
          Tap a player to hear them cheer ⚽
        </p>
        <button
          type="button"
          onClick={doWave}
          className="mt-2 w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white transition hover:bg-brand-navy"
        >
          全体欢呼 🎉
        </button>
      </div>
    </div>
  );
}
