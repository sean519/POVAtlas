import type { WorldCountry } from "../../types";
import { flagSrc } from "../../utils/world";

/** Flag image for any Atlas country; the code shows if the image can't load. */
export default function CountryFlag({
  country,
  className = "h-5 w-7",
}: {
  country: Pick<WorldCountry, "iso2" | "code" | "name">;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] bg-slate-200 text-[8px] font-bold uppercase text-slate-500 shadow-sm ring-1 ring-black/10 ${className}`}
      title={country.name}
    >
      <span className="absolute">{country.code}</span>
      <img
        src={flagSrc(country.iso2)}
        alt=""
        loading="lazy"
        draggable={false}
        className="relative h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </span>
  );
}
