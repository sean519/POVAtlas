import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AttributionControl,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Team } from "../types";
import { getTeamByCode } from "../utils/dataHelpers";
import { flagUrl } from "../utils/flags";

interface WorldMapProps {
  teams: Team[];
  /** fifaCodes to highlight (selected + hovered + comparison). */
  highlightCodes: string[];
  /** The primary selected fifaCode (gets the strongest style + fly-to). */
  focusCode: string | null;
  /** Two fifaCodes to frame together (a selected match) via fit-bounds. */
  fitCodes: string[] | null;
  onTeamClick: (code: string) => void;
  onTeamHover: (code: string | null) => void;
}

// A compact world GeoJSON keyed by ISO A3 in feature.id.
const GEOJSON_URL =
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

type GeoData = GeoJSON.FeatureCollection;

export default function WorldMap({
  teams,
  highlightCodes,
  focusCode,
  fitCodes,
  onTeamClick,
  onTeamHover,
}: WorldMapProps) {
  const [geo, setGeo] = useState<GeoData | null>(null);
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(GEOJSON_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: GeoData) => {
        if (!cancelled) setGeo(data);
      })
      .catch(() => {
        if (!cancelled) setGeoError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const highlightSet = useMemo(() => new Set(highlightCodes), [highlightCodes]);
  const anyActive = highlightSet.size > 0;

  // Map ISO A3 (geojson id) -> team for polygon matching.
  const isoToTeam = useMemo(() => {
    const m = new Map<string, Team>();
    for (const t of teams) m.set(t.isoA3Code, t);
    return m;
  }, [teams]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[25, 5]}
        zoom={2}
        minZoom={2}
        maxZoom={7}
        zoomSnap={0.25}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={120}
        worldCopyJump
        scrollWheelZoom
        zoomAnimation
        fadeAnimation
        attributionControl={false}
        className="h-full w-full"
        style={{ minHeight: "100%" }}
      >
        {/* Attribution bottom-left so it's never hidden by the comparison card */}
        <AttributionControl position="bottomleft" prefix={false} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {geo && (
          <GeoLayer
            data={geo}
            isoToTeam={isoToTeam}
            highlightSet={highlightSet}
            focusCode={focusCode}
            anyActive={anyActive}
            onTeamClick={onTeamClick}
            onTeamHover={onTeamHover}
          />
        )}

        {/* Markers for all teams — always render so the app works offline too */}
        {teams.map((team) => (
          <TeamMarker
            key={team.fifaCode}
            team={team}
            active={highlightSet.has(team.fifaCode)}
            dimmed={anyActive && !highlightSet.has(team.fifaCode)}
            onTeamClick={onTeamClick}
            onTeamHover={onTeamHover}
          />
        ))}

        {/* Animated arc linking the two teams of a selected match */}
        <MatchArc codes={fitCodes} />

        <MapController focusCode={focusCode} fitCodes={fitCodes} />
      </MapContainer>

      {/* Legend (top-right, out of the way of the comparison card) */}
      <div className="pointer-events-none absolute right-3 top-3 z-[500] rounded-lg bg-white/90 px-3 py-2 text-[11px] text-slate-600 shadow-card backdrop-blur">
        <p className="mb-1 font-bold text-brand-navy">Map key</p>
        <p>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand-gold align-middle" />
          Selected / highlighted team
        </p>
        <p>🚩 Marker = team location · click to explore</p>
      </div>

      {geoError && (
        <div className="absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800 shadow">
          Country borders couldn&rsquo;t load — showing markers only.
        </div>
      )}
    </div>
  );
}

/* ---------------- GeoJSON polygons (imperative for fast restyling) ------- */

interface GeoLayerProps {
  data: GeoData;
  isoToTeam: Map<string, Team>;
  highlightSet: Set<string>;
  focusCode: string | null;
  anyActive: boolean;
  onTeamClick: (code: string) => void;
  onTeamHover: (code: string | null) => void;
}

function GeoLayer({
  data,
  isoToTeam,
  highlightSet,
  focusCode,
  anyActive,
  onTeamClick,
  onTeamHover,
}: GeoLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  // Keep the latest values in refs so event handlers always read fresh data.
  const stateRef = useRef({ isoToTeam, highlightSet, focusCode, anyActive });
  stateRef.current = { isoToTeam, highlightSet, focusCode, anyActive };

  const styleFor = (team: Team | undefined): L.PathOptions => {
    if (!team) {
      // Not a World Cup country
      return {
        weight: 0.5,
        color: "#cbd5e1",
        fillColor: "#e2e8f0",
        fillOpacity: anyActive ? 0.25 : 0.4,
      };
    }
    const isFocus = focusCode === team.fifaCode;
    const isActive = highlightSet.has(team.fifaCode);
    if (isFocus) {
      return {
        weight: 2.5,
        color: "#0b1f3a",
        fillColor: "#f6c453",
        fillOpacity: 0.85,
      };
    }
    if (isActive) {
      return {
        weight: 2,
        color: "#11487f",
        fillColor: "#2f8fd6",
        fillOpacity: 0.7,
      };
    }
    if (anyActive) {
      return {
        weight: 0.5,
        color: "#94a3b8",
        fillColor: "#cbd5e1",
        fillOpacity: 0.3,
      };
    }
    return {
      weight: 1,
      color: "#1f9e6b",
      fillColor: "#1f9e6b",
      fillOpacity: 0.45,
    };
  };

  // Build the layer once.
  useEffect(() => {
    const layer = L.geoJSON(data, {
      style: (feature) => {
        const team = feature?.id
          ? stateRef.current.isoToTeam.get(String(feature.id))
          : undefined;
        return styleFor(team);
      },
      onEachFeature: (feature, lyr) => {
        const team = feature?.id
          ? isoToTeam.get(String(feature.id))
          : undefined;
        if (team) {
          lyr.bindTooltip(`${team.teamName} · ${team.nameZh}`, {
            sticky: true,
            direction: "top",
          });
          lyr.on({
            click: () => onTeamClick(team.fifaCode),
            mouseover: () => onTeamHover(team.fifaCode),
            mouseout: () => onTeamHover(null),
          });
        }
      },
    });
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      layer.remove();
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, map]);

  // Restyle whenever highlight/selection changes.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.eachLayer((lyr) => {
      const feature = (lyr as L.GeoJSON & { feature?: GeoJSON.Feature }).feature;
      const team = feature?.id ? isoToTeam.get(String(feature.id)) : undefined;
      (lyr as L.Path).setStyle(styleFor(team));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightSet, focusCode, anyActive, isoToTeam]);

  return null;
}

/* ---------------- Markers ------------------------------------------------ */

interface TeamMarkerProps {
  team: Team;
  active: boolean;
  dimmed: boolean;
  onTeamClick: (code: string) => void;
  onTeamHover: (code: string | null) => void;
}

function TeamMarker({
  team,
  active,
  dimmed,
  onTeamClick,
  onTeamHover,
}: TeamMarkerProps) {
  const icon = useMemo(() => {
    const cls = ["team-marker", active && "is-active", dimmed && "is-dimmed"]
      .filter(Boolean)
      .join(" ");
    return L.divIcon({
      className: "",
      html: `<div class="${cls}"><span class="ring"></span><img class="flag" src="${flagUrl(
        team.iso2
      )}" alt="${team.fifaCode}" /></div>`,
      iconSize: [30, 22],
      iconAnchor: [15, 11],
    });
  }, [team.iso2, team.fifaCode, active, dimmed]);

  return (
    <Marker
      position={[team.lat, team.lng]}
      icon={icon}
      zIndexOffset={active ? 1000 : 0}
      eventHandlers={{
        click: () => onTeamClick(team.fifaCode),
        mouseover: () => onTeamHover(team.fifaCode),
        mouseout: () => onTeamHover(null),
      }}
    >
      <Tooltip direction="top" offset={[0, -12]} opacity={1}>
        <span className="font-semibold">
          {team.teamName} {team.nameZh}
        </span>
        <span className="ml-1 text-slate-400">({team.fifaCode})</span>
      </Tooltip>
    </Marker>
  );
}

/* ---------------- Match arc (links two countries) ---------------------- */

// Build a gently curved arc (quadratic bezier) between two lat/lng points.
function buildArc(
  a: [number, number],
  b: [number, number]
): [number, number][] {
  const [latA, lngA] = a;
  const [latB, lngB] = b;
  const midLat = (latA + latB) / 2;
  const midLng = (lngA + lngB) / 2;
  const dist = Math.hypot(latB - latA, lngB - lngA);
  const lift = Math.min(Math.max(dist * 0.18, 4), 22); // raise the apex north
  const ctrlLat = midLat + lift;
  const points: [number, number][] = [];
  const segments = 48;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    const lat = mt * mt * latA + 2 * mt * t * ctrlLat + t * t * latB;
    const lng = mt * mt * lngA + 2 * mt * t * midLng + t * t * lngB;
    points.push([lat, lng]);
  }
  return points;
}

function MatchArc({ codes }: { codes: string[] | null }) {
  const key = codes ? codes.join(",") : "";
  const data = useMemo(() => {
    if (!codes || codes.length < 2) return null;
    const a = getTeamByCode(codes[0]);
    const b = getTeamByCode(codes[1]);
    if (!a || !b) return null;
    const curve = buildArc([a.lat, a.lng], [b.lat, b.lng]);
    return { curve, mid: curve[Math.floor(curve.length / 2)] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const ballIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: '<div class="match-ball">⚽</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    []
  );

  if (!data) return null;

  return (
    <>
      {/* Soft glow underlay */}
      <Polyline
        positions={data.curve}
        interactive={false}
        pathOptions={{ color: "#ffffff", weight: 6, opacity: 0.7 }}
      />
      <Polyline
        positions={data.curve}
        interactive={false}
        pathOptions={{ className: "match-arc", color: "#5b86e5", weight: 3 }}
      />
      <Marker
        position={data.mid}
        icon={ballIcon}
        interactive={false}
        zIndexOffset={1500}
      />
    </>
  );
}

/* --------- Camera control (fly-to + fit-bounds) + responsive resize ----- */

function MapController({
  focusCode,
  fitCodes,
}: {
  focusCode: string | null;
  fitCodes: string[] | null;
}) {
  const map = useMap();
  const targetRef = useRef<string>("world");

  // A single key describing the current camera target.
  const target = fitCodes?.length
    ? `fit:${fitCodes.join(",")}`
    : focusCode
    ? `team:${focusCode}`
    : "world";

  // Move the camera to a target. Returns false if the map isn't visible yet
  // (a 0-size container would make Leaflet throw), so we can retry later.
  const apply = useCallback(
    (t: string): boolean => {
      const size = map.getSize();
      if (size.x < 20 || size.y < 20) return false;
      try {
        // Collect the point(s) to frame (1 for a team, 2 for a match).
        let pts: [number, number][] = [];
        let maxZoom = 5;
        if (t.startsWith("fit:")) {
          pts = t
            .slice(4)
            .split(",")
            .map((c) => getTeamByCode(c))
            .filter((tm): tm is Team => Boolean(tm))
            .map((tm) => [tm.lat, tm.lng] as [number, number]);
        } else if (t.startsWith("team:")) {
          const team = getTeamByCode(t.slice(5));
          if (team) {
            pts = [[team.lat, team.lng]];
            maxZoom = 4.5;
          }
        }

        if (pts.length >= 1) {
          // On phones a bottom sheet covers ~72% of the map, so pad the bottom
          // heavily to keep the framed countries in the visible top band.
          const isPhone = window.innerWidth < 640;
          const opts: L.FitBoundsOptions = isPhone
            ? {
                paddingTopLeft: [30, 40],
                paddingBottomRight: [30, Math.round(size.y * 0.72) + 24],
                maxZoom,
                duration: 0.9,
              }
            : { padding: [70, 70], maxZoom, duration: 0.9 };
          map.flyToBounds(L.latLngBounds(pts), opts);
          return true;
        }

        map.flyTo([25, 5], 2, { duration: 0.8 });
        return true;
      } catch {
        return false;
      }
    },
    [map]
  );

  // Animate whenever the selection target changes.
  useEffect(() => {
    if (target === targetRef.current) return;
    targetRef.current = target;
    apply(target);
  }, [target, apply]);

  // Keep Leaflet sized to its container (window resize, panel collapse, mobile
  // tab switch) and re-frame the current target once the map becomes visible.
  useEffect(() => {
    const container = map.getContainer();
    let wasVisible = map.getSize().x > 20;
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
      const visibleNow = map.getSize().x > 20;
      if (visibleNow && !wasVisible) apply(targetRef.current);
      wasVisible = visibleNow;
    });
    ro.observe(container);
    const t = window.setTimeout(() => map.invalidateSize(), 200);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [map, apply]);

  return null;
}
