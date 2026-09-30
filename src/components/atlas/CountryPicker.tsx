import { useId, useMemo, useState } from "react";
import type { WorldCountry } from "../../types";
import { searchCountries } from "../../utils/world";
import CountryFlag from "./CountryFlag";

/**
 * Search-as-you-type country input (English or Chinese names, or codes).
 * Arrow keys + Enter pick; the input clears after each pick.
 */
export default function CountryPicker({
  countries,
  onPick,
  placeholder = "Type a country · 输入国家",
  exclude,
  autoFocus,
  disabled,
}: {
  countries: WorldCountry[];
  onPick: (c: WorldCountry) => void;
  placeholder?: string;
  /** Codes that can't be picked (e.g. already guessed). */
  exclude?: Set<string>;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const options = useMemo(
    () => searchCountries(countries, query, 12).filter((c) => !exclude?.has(c.code)).slice(0, 8),
    [countries, query, exclude]
  );

  const pick = (c: WorldCountry) => {
    onPick(c);
    setQuery("");
    setOpen(false);
    setActive(0);
  };

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && options[active]) {
            e.preventDefault();
            pick(options[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/40 disabled:bg-slate-50"
      />
      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-card"
        >
          {options.map((c, i) => (
            <li
              key={c.code}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so the input's blur doesn't close us first
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm ${
                i === active ? "bg-brand-sky/10" : ""
              }`}
            >
              <CountryFlag country={c} className="h-4 w-6" />
              <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{c.name}</span>
              <span className="shrink-0 text-xs text-slate-400">{c.nameZh}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
