export type Section = "atlas" | "worldcup";

/** Top-of-panel switch between the Atlas and event sections (World Cup 2026). */
export default function SectionSwitch({
  section,
  onChange,
}: {
  section: Section;
  onChange: (s: Section) => void;
}) {
  const items: { id: Section; label: string }[] = [
    { id: "atlas", label: "🌍 Atlas" },
    { id: "worldcup", label: "⚽ World Cup 2026" },
  ];
  return (
    <div className="flex gap-1 border-b border-slate-200 bg-white p-1.5" role="tablist" aria-label="Section">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={section === it.id}
          onClick={() => onChange(it.id)}
          className={[
            "flex-1 rounded-lg px-2 py-1.5 text-xs font-extrabold transition",
            section === it.id
              ? "bg-gradient-to-r from-brand-blue to-brand-lilac text-white shadow"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200",
          ].join(" ")}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
