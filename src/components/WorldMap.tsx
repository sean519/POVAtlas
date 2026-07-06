import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AttributionControl,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { Team } from "../types";
import { getTeamByCode } from "../utils/dataHelpers";
import { flagUrl } from "../utils/flags";
import { OC_HQ, OC_TRIGGER } from "../data/easterEgg";

interface WorldMapProps {
  teams: Team[];
  /** fifaCodes to highlight (selected + hovered + comparison). */
  highlightCodes: string[];
  /** The primary selected fifaCode (gets the strongest style + fly-to). */
  focusCode: string | null;
  /** Two fifaCodes to frame together (a selected match) via fit-bounds. */
  fitCodes: string[] | null;
  /** The selected match's stadium: the ⚽ sits here and both arcs meet on it. */
  venue: { lat: number; lng: number; label: string } | null;
  onTeamClick: (code: string) => void;
  onTeamHover: (code: string | null) => void;
  /** Fired when the hidden Orange County easter egg marker is clicked. */
  onEasterEgg: () => void;
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
  venue,
  onTeamClick,
  onTeamHover,
  onEasterEgg,
}: WorldMapProps) {
  const [geo, setGeo] = useState<GeoData | null>(null);
  const [geoError, setGeoError] = useState(false);
  // Base layer: street map (CARTO) or satellite imagery (Esri) + label overlay.
  const [satellite, setSatellite] = useState(false);

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
        maxZoom={12}
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
        {satellite ? (
          <>
            <TileLayer
              key="satellite"
              attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            {/* Place-name labels over the imagery (white text reads well) */}
            <TileLayer
              key="satellite-labels"
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              zIndex={2}
            />
          </>
        ) : (
          <TileLayer
            key="streets"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        )}

        {geo && (
          <GeoLayer
            data={geo}
            isoToTeam={isoToTeam}
            highlightSet={highlightSet}
            focusCode={focusCode}
            anyActive={anyActive}
            satellite={satellite}
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

        {/* Animated arcs linking the two teams of a selected match, meeting
            at the venue's ⚽ when the stadium is known */}
        <MatchArc codes={fitCodes} venue={venue} />

        {/* Hidden easter egg — only shows when zoomed into Orange County */}
        <OcEasterEgg onOpen={onEasterEgg} />

        <MapController focusCode={focusCode} fitCodes={fitCodes} venue={venue} />
      </MapContainer>

      {/* Base-layer toggle: street map ↔ satellite imagery */}
      <button
        type="button"
        onClick={() => setSatellite((s) => !s)}
        title={satellite ? "切换为地图 · Switch to map view" : "切换为卫星图 · Switch to satellite view"}
        className="absolute right-3 top-3 z-[500] flex items-center gap-1.5 rounded-xl border border-white/60 bg-white/95 px-2.5 py-1.5 text-xs font-bold text-slate-600 shadow-card ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
      >
        <span aria-hidden>{satellite ? "🗺️" : "🛰️"}</span>
        {satellite ? "Map" : "Satellite"}
      </button>

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
  /** Satellite base layer active → mute fills so imagery stays visible. */
  satellite: boolean;
  onTeamClick: (code: string) => void;
  onTeamHover: (code: string | null) => void;
}

function GeoLayer({
  data,
  isoToTeam,
  highlightSet,
  focusCode,
  anyActive,
  satellite,
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
      // Not a World Cup country. Over satellite imagery: thin light border,
      // no fill, so the imagery isn't washed out.
      if (satellite) {
        return { weight: 0.4, color: "rgba(255,255,255,0.45)", fillOpacity: 0 };
      }
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
      // Outline-only highlight: a clear gold border, no fill — so the selected
      // country is marked without the heavy yellow wash. fillOpacity 0 keeps a
      // transparent fill so the interior stays clickable.
      return {
        weight: 3,
        color: "#dca42f",
        fillColor: "#fbe2a0",
        fillOpacity: 0,
      };
    }
    if (isActive) {
      return {
        weight: 2,
        color: satellite ? "#8fd0ff" : "#11487f",
        fillColor: "#2f8fd6",
        fillOpacity: satellite ? 0.35 : 0.7,
      };
    }
    if (anyActive) {
      if (satellite) {
        return { weight: 0.4, color: "rgba(255,255,255,0.3)", fillOpacity: 0 };
      }
      return {
        weight: 0.5,
        color: "#94a3b8",
        fillColor: "#cbd5e1",
        fillOpacity: 0.3,
      };
    }
    // Resting state (nothing selected): subtle, so nothing looks "highlighted".
    if (satellite) {
      return { weight: 0.6, color: "rgba(255,255,255,0.55)", fillOpacity: 0 };
    }
    return {
      weight: 0.6,
      color: "#bcd9cb",
      fillColor: "#bcd9cb",
      fillOpacity: 0.22,
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

  // Restyle whenever highlight/selection or the base layer changes.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.eachLayer((lyr) => {
      const feature = (lyr as L.GeoJSON & { feature?: GeoJSON.Feature }).feature;
      const team = feature?.id ? isoToTeam.get(String(feature.id)) : undefined;
      (lyr as L.Path).setStyle(styleFor(team));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightSet, focusCode, anyActive, isoToTeam, satellite]);

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

function MatchArc({
  codes,
  venue,
}: {
  codes: string[] | null;
  venue: { lat: number; lng: number; label: string } | null;
}) {
  const key = `${codes ? codes.join(",") : ""}|${venue ? venue.label : ""}`;
  const data = useMemo(() => {
    if (!codes || codes.length < 2) return null;
    const a = getTeamByCode(codes[0]);
    const b = getTeamByCode(codes[1]);
    if (!a || !b) return null;
    if (venue) {
      // Both teams' arcs converge on the stadium, where the ⚽ sits.
      const v: [number, number] = [venue.lat, venue.lng];
      return {
        curves: [buildArc([a.lat, a.lng], v), buildArc([b.lat, b.lng], v)],
        ball: v,
        label: venue.label,
      };
    }
    // Venue unknown — fall back to one arc with the ball at its midpoint.
    const curve = buildArc([a.lat, a.lng], [b.lat, b.lng]);
    return {
      curves: [curve],
      ball: curve[Math.floor(curve.length / 2)],
      label: null,
    };
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
      {data.curves.map((curve, i) => (
        <Fragment key={`${key}-${i}`}>
          {/* Soft glow underlay */}
          <Polyline
            positions={curve}
            interactive={false}
            pathOptions={{ color: "#ffffff", weight: 6, opacity: 0.7 }}
          />
          <Polyline
            positions={curve}
            interactive={false}
            pathOptions={{ className: "match-arc", color: "#5b86e5", weight: 3 }}
          />
        </Fragment>
      ))}
      <Marker
        position={data.ball}
        icon={ballIcon}
        interactive={Boolean(data.label)}
        zIndexOffset={1500}
      >
        {data.label && (
          <Tooltip direction="top" offset={[0, -12]} opacity={1}>
            <span className="font-semibold">🏟️ {data.label}</span>
          </Tooltip>
        )}
      </Marker>
    </>
  );
}

/* ---------------- Hidden Orange County easter egg ----------------------- */

function OcEasterEgg({ onOpen }: { onOpen: () => void }) {
  const [visible, setVisible] = useState(false);

  const map = useMapEvents({
    zoomend: () => check(),
    moveend: () => check(),
  });

  function check() {
    const z = map.getZoom();
    const c = map.getCenter();
    setVisible(
      z >= OC_TRIGGER.minZoom &&
        c.lat > OC_TRIGGER.latMin &&
        c.lat < OC_TRIGGER.latMax &&
        c.lng > OC_TRIGGER.lngMin &&
        c.lng < OC_TRIGGER.lngMax
    );
  }

  // Check once after mount too, in case the map already rests over OC.
  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: '<div class="oc-hq">🏡</div>',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
    []
  );

  if (!visible) return null;

  return (
    <Marker
      position={[OC_HQ.lat, OC_HQ.lng]}
      icon={icon}
      zIndexOffset={2000}
      eventHandlers={{ click: onOpen }}
    >
      <Tooltip direction="top" offset={[0, -16]} opacity={1}>
        <span className="font-bold">🎁 {OC_HQ.title} — 点我!</span>
      </Tooltip>
    </Marker>
  );
}

/* --------- Camera control (fly-to + fit-bounds) + responsive resize ----- */

function MapController({
  focusCode,
  fitCodes,
  venue,
}: {
  focusCode: string | null;
  fitCodes: string[] | null;
  venue: { lat: number; lng: number; label: string } | null;
}) {
  const map = useMap();
  const targetRef = useRef<string>("world");

  // Latest venue for apply() to read — the venue point joins the fit bounds so
  // the stadium ⚽ always ends up in frame.
  const venueRef = useRef(venue);
  venueRef.current = venue;

  // A single key describing the current camera target.
  const target = fitCodes?.length
    ? `fit:${fitCodes.join(",")}${venue ? `@${venue.lat},${venue.lng}` : ""}`
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
            .split("@")[0]
            .split(",")
            .map((c) => getTeamByCode(c))
            .filter((tm): tm is Team => Boolean(tm))
            .map((tm) => [tm.lat, tm.lng] as [number, number]);
          const v = venueRef.current;
          if (v) pts.push([v.lat, v.lng]);
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
