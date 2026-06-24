import type { Group } from "../types";

/**
 * Distinct, accessible color per group, used for the group badges and labels.
 * Each entry provides a tailwind-friendly background, text, and a raw hex
 * (handy for the map / inline styles).
 */
export const groupColors: Record<
  Group,
  { bg: string; text: string; ring: string; hex: string }
> = {
  A: { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-300", hex: "#e11d48" },
  B: { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-300", hex: "#ea580c" },
  C: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-300", hex: "#d97706" },
  D: { bg: "bg-lime-100", text: "text-lime-700", ring: "ring-lime-300", hex: "#65a30d" },
  E: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-300", hex: "#059669" },
  F: { bg: "bg-teal-100", text: "text-teal-700", ring: "ring-teal-300", hex: "#0d9488" },
  G: { bg: "bg-cyan-100", text: "text-cyan-700", ring: "ring-cyan-300", hex: "#0891b2" },
  H: { bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-300", hex: "#0284c7" },
  I: { bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-300", hex: "#4f46e5" },
  J: { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-300", hex: "#7c3aed" },
  K: { bg: "bg-fuchsia-100", text: "text-fuchsia-700", ring: "ring-fuchsia-300", hex: "#c026d3" },
  L: { bg: "bg-pink-100", text: "text-pink-700", ring: "ring-pink-300", hex: "#db2777" },
};
