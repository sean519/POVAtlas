import { useMemo } from "react";

type Ring = number[][];

/**
 * A country's outline as an SVG silhouette (Web Mercator, like the map), fitted
 * to its box. Handles shapes that cross the 180° meridian (Russia, Fiji…).
 */
export default function CountryShape({
  feature,
  className = "h-40 w-full",
  fill = "#3a4a73",
  label,
}: {
  feature: GeoJSON.Feature;
  className?: string;
  fill?: string;
  /** Accessible label; omit for a pure puzzle silhouette. */
  label?: string;
}) {
  const shape = useMemo(() => buildShape(feature), [feature]);
  if (!shape) return null;
  return (
    <svg
      viewBox={shape.viewBox}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
      aria-label={label ?? "Country silhouette"}
    >
      <path d={shape.d} fill={fill} fillRule="evenodd" stroke={fill} strokeWidth={0.6} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function buildShape(feature: GeoJSON.Feature): { d: string; viewBox: string } | null {
  const g = feature.geometry;
  const polys: Ring[][] =
    g?.type === "Polygon"
      ? [g.coordinates as Ring[]]
      : g?.type === "MultiPolygon"
      ? (g.coordinates as Ring[][])
      : [];
  if (!polys.length) return null;

  // Shift western longitudes east when the shape straddles the antimeridian.
  const lngs = polys.flat(2).map((p) => p[0]);
  const wraps = Math.max(...lngs) - Math.min(...lngs) > 180;
  const project = ([lng, lat]: number[]): [number, number] => {
    const x = wraps && lng < 0 ? lng + 360 : lng;
    const clamped = Math.max(-85, Math.min(85, lat));
    const y = -Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360)) * (180 / Math.PI);
    return [x, y];
  };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const parts: string[] = [];
  for (const poly of polys) {
    for (const ring of poly) {
      const pts = ring.map(project);
      for (const [x, y] of pts) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      parts.push(`M${pts.map(([x, y]) => `${x.toFixed(3)} ${y.toFixed(3)}`).join("L")}Z`);
    }
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const pad = Math.max(w, h) * 0.06;
  return {
    d: parts.join(""),
    viewBox: `${(minX - pad).toFixed(3)} ${(minY - pad).toFixed(3)} ${(w + 2 * pad).toFixed(3)} ${(h + 2 * pad).toFixed(3)}`,
  };
}
