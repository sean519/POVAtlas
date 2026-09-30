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
import { loadGeo, type GeoData } from "../utils/geo";

/** How an Atlas country is marked: selected ("focus") or compare slot A / B. */
export type AtlasTone = "focus" | "a" | "b";

/** Camera target for the Atlas: boxes of [lat, lng, span in degrees]. */
export interface AtlasFrame {
  key: string;
  boxes: [number, number, number][];
}

interface WorldMapProps {
  /** "atlas": every country equal + clickable; "worldcup": team styling, flags, arcs. */
  mode: "atlas" | "worldcup";
  /** Atlas countries to mark (selected country, or the compare pair). */
  atlasMarks: { code: string; tone: AtlasTone }[];
  atlasFrame: AtlasFrame | null;
  /** Country name for tooltips (null until the Atlas data has loaded). */
  countryName: ((code: string) => string | undefined) | null;
  /** Any country polygon clicked (ISO A3 / Atlas code). */
  onCountryClick: (code: string) => void;
  /** An info card covers the map's right side (desktop) — frame around it. */
  cardOpen: boolean;
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

// Start the borders download as soon as this module loads, in parallel with
// React's first render.
loadGeo();

export default function WorldMap({
  mode,
  atlasMarks,
  atlasFrame,
  countryName,
  onCountryClick,
  cardOpen,
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
    loadGeo()
      .then((data) => {
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
  const marks = useMemo(
    () => new Map(atlasMarks.map((m) => [m.code, m.tone] as const)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [atlasMarks.map((m) => `${m.code}:${m.tone}`).join(",")]
  );
  const anyActive = highlightSet.size > 0 || marks.size > 0;

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
            {/* Borders + place names over the imagery */}
            <TileLayer
              key="satellite-labels"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              zIndex={2}
            />
          </>
        ) : (
          // Esri Light Gray Canvas (keyless). CARTO's free basemaps started
          // requiring an API key in 2026 and now serve a watermark instead.
          <>
            <TileLayer
              key="streets"
              attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={16}
            />
            <TileLayer
              key="streets-labels"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={16}
              zIndex={2}
            />
          </>
        )}

        {geo && (
          <GeoLayer
            data={geo}
            mode={mode}
            marks={marks}
            countryName={countryName}
            isoToTeam={isoToTeam}
            highlightSet={highlightSet}
            focusCode={focusCode}
            anyActive={anyActive}
            satellite={satellite}
            onCountryClick={onCountryClick}
            onTeamHover={onTeamHover}
          />
        )}

        {mode === "worldcup" && (
          <>
            {/* Flag markers for the 48 teams */}
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
          </>
        )}

        {/* Hidden easter egg — only shows when zoomed into Orange County */}
        <OcEasterEgg onOpen={onEasterEgg} />

        <MapController
          focusCode={focusCode}
          fitCodes={fitCodes}
          venue={venue}
          atlasFrame={atlasFrame}
          cardOpen={cardOpen}
        />
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
  mode: "atlas" | "worldcup";
  marks: Map<string, AtlasTone>;
  countryName: ((code: string) => string | undefined) | null;
  isoToTeam: Map<string, Team>;
  highlightSet: Set<string>;
  focusCode: string | null;
  anyActive: boolean;
  /** Satellite base layer active → mute fills so imagery stays visible. */
  satellite: boolean;
  onCountryClick: (code: string) => void;
  onTeamHover: (code: string | null) => void;
}

/** Fill/border for Atlas marks; A/B match the Compare view's blue/orange. */
const MARK_STYLE: Record<AtlasTone, { color: string; fill: string }> = {
  focus: { color: "#6d4fc2", fill: "#9d86e9" },
  a: { color: "#2f5fc4", fill: "#5b86e5" },
  b: { color: "#d9713f", fill: "#f4a37a" },
};

function GeoLayer({
  data,
  mode,
  marks,
  countryName,
  isoToTeam,
  highlightSet,
  focusCode,
  anyActive,
  satellite,
  onCountryClick,
  onTeamHover,
}: GeoLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  const styleFor = (code: string, team: Team | undefined): L.PathOptions => {
    const mark = marks.get(code);
    if (mark) {
      const s = MARK_STYLE[mark];
      return { weight: 2.5, color: s.color, fillColor: s.fill, fillOpacity: satellite ? 0.35 : 0.6 };
    }
    if (mode === "atlas" || !team) {
      // Atlas: every country equal (and clickable). World Cup: non-teams.
      if (satellite) {
        return { weight: 0.5, color: "rgba(255,255,255,0.5)", fillOpacity: 0 };
      }
      if (mode === "atlas") {
        return { weight: 0.6, color: "#a9bfd9", fillColor: "#dbe7f5", fillOpacity: anyActive ? 0.25 : 0.45 };
      }
      return { weight: 0.5, color: "#cbd5e1", fillColor: "#e2e8f0", fillOpacity: anyActive ? 0.25 : 0.4 };
    }
    const isFocus = focusCode === team.fifaCode;
    const isActive = highlightSet.has(team.fifaCode);
    if (isFocus) {
      // Outline-only highlight: a clear gold border, no fill — so the selected
      // country is marked without the heavy yellow wash. fillOpacity 0 keeps a
      // transparent fill so the interior stays clickable.
      return { weight: 3, color: "#dca42f", fillColor: "#fbe2a0", fillOpacity: 0 };
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
      if (satellite) return { weight: 0.4, color: "rgba(255,255,255,0.3)", fillOpacity: 0 };
      return { weight: 0.5, color: "#94a3b8", fillColor: "#cbd5e1", fillOpacity: 0.3 };
    }
    // Resting state (nothing selected): subtle, so nothing looks "highlighted".
    if (satellite) return { weight: 0.6, color: "rgba(255,255,255,0.55)", fillOpacity: 0 };
    return { weight: 0.6, color: "#bcd9cb", fillColor: "#bcd9cb", fillOpacity: 0.22 };
  };

  // Event handlers + tooltips read the latest values through a ref, since the
  // layer (and its listeners) is built only once.
  const live = { mode, isoToTeam, countryName, onCountryClick, onTeamHover, styleFor };
  const liveRef = useRef(live);
  liveRef.current = live;

  // Build the layer once.
  useEffect(() => {
    const idOf = (f: GeoJSON.Feature | undefined) => (f?.id != null ? String(f.id) : "");
    const layer = L.geoJSON(data, {
      style: (feature) => {
        const code = idOf(feature);
        return liveRef.current.styleFor(code, liveRef.current.isoToTeam.get(code));
      },
      onEachFeature: (feature, lyr) => {
        const code = idOf(feature);
        if (!code || code === "-99") return; // unlabelled areas aren't interactive
        const teamFor = () =>
          liveRef.current.mode === "worldcup" ? liveRef.current.isoToTeam.get(code) : undefined;
        lyr.bindTooltip(
          () => {
            const team = teamFor();
            if (team) return `${team.teamName} · ${team.nameZh}`;
            return liveRef.current.countryName?.(code) ?? code;
          },
          { sticky: true, direction: "top" }
        );
        lyr.on({
          click: () => liveRef.current.onCountryClick(code),
          mouseover: () => {
            const team = teamFor();
            if (team) liveRef.current.onTeamHover(team.fifaCode);
            else (lyr as L.Path).setStyle({ weight: 1.8, color: "#475569" });
          },
          mouseout: () => {
            const team = teamFor();
            if (team) liveRef.current.onTeamHover(null);
            else (lyr as L.Path).setStyle(liveRef.current.styleFor(code, liveRef.current.isoToTeam.get(code)));
          },
        });
      },
    });
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      layer.remove();
      layerRef.current = null;
    };
  }, [data, map]);

  // Restyle whenever highlight/selection, mode or the base layer changes.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.eachLayer((lyr) => {
      const feature = (lyr as L.GeoJSON & { feature?: GeoJSON.Feature }).feature;
      const code = feature?.id != null ? String(feature.id) : "";
      (lyr as L.Path).setStyle(styleFor(code, isoToTeam.get(code)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightSet, focusCode, anyActive, isoToTeam, satellite, mode, marks]);

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
  atlasFrame,
  cardOpen,
}: {
  focusCode: string | null;
  fitCodes: string[] | null;
  venue: { lat: number; lng: number; label: string } | null;
  atlasFrame: AtlasFrame | null;
  cardOpen: boolean;
}) {
  const map = useMap();
  const targetRef = useRef<string>("world");
  const cardOpenRef = useRef(cardOpen);
  cardOpenRef.current = cardOpen;

  // Latest venue for apply() to read — the venue point joins the fit bounds so
  // the stadium ⚽ always ends up in frame.
  const venueRef = useRef(venue);
  venueRef.current = venue;
  const atlasRef = useRef(atlasFrame);
  atlasRef.current = atlasFrame;

  // A single key describing the current camera target.
  const target = atlasFrame
    ? `atlas:${atlasFrame.key}`
    : fitCodes?.length
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
        if (t.startsWith("atlas:")) {
          // Each box: centre ± half its span (longitude widened by latitude).
          for (const [lat, lng, span] of atlasRef.current?.boxes ?? []) {
            const dLat = span / 2;
            const dLng = span / 2 / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
            const clampLat = (v: number) => Math.max(-85, Math.min(85, v));
            pts.push([clampLat(lat - dLat), lng - dLng], [clampLat(lat + dLat), lng + dLng]);
          }
          maxZoom = 6;
        } else if (t.startsWith("fit:")) {
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
          // Desktop: the info card (~23rem) sits on the right — keep the
          // framed area clear of it when a card is open.
          const cardPad = cardOpenRef.current ? Math.min(400, Math.round(size.x * 0.45)) : 70;
          const opts: L.FitBoundsOptions = isPhone
            ? {
                paddingTopLeft: [30, 40],
                paddingBottomRight: [30, Math.round(size.y * 0.72) + 24],
                maxZoom,
                duration: 0.9,
              }
            : { paddingTopLeft: [70, 70], paddingBottomRight: [cardPad, 70], maxZoom, duration: 0.9 };
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
