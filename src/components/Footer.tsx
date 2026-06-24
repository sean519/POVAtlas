/**
 * App footer with data-source notes. No FIFA branding is used.
 */
export default function Footer() {
  return (
    <footer className="hidden border-t border-slate-200 bg-white/70 px-4 py-4 text-center text-xs leading-relaxed text-slate-500 lg:block">
      <p className="mx-auto max-w-3xl">
        Country facts are <strong>approximate sample data</strong> for
        educational use. Replace with{" "}
        <span className="font-medium text-slate-600">World Bank</span>,{" "}
        <span className="font-medium text-slate-600">REST Countries</span>, and
        official World Cup schedule data for production.
      </p>
      <p className="mx-auto mt-1 max-w-3xl">
        Map tiles © OpenStreetMap contributors. This is an independent learning
        project and is not affiliated with or endorsed by FIFA. No official
        logos or branding are used.
      </p>
      <p className="mt-2 text-[11px] text-slate-400">
        World Cup Geography Map — learn where every World Cup team is on the map.
      </p>
    </footer>
  );
}
