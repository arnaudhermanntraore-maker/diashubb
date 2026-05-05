import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMapboxToken } from "@/server/config.functions";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  price_usd?: number;
  region?: "usa" | "africa";
}

interface Props {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (id: string) => void;
  fitBoundsOnLoad?: boolean;
  autoFit?: boolean;
  emptyMessage?: string;
}

export function MapView({ markers = [], center = [-84.3880, 33.7490], zoom = 10, height = "420px", onMarkerClick, fitBoundsOnLoad = false, autoFit = false, emptyMessage }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getMapboxToken().then((r) => {
      if (!r.token) setErr("Map unavailable — token missing.");
      else setToken(r.token);
    }).catch(() => setErr("Map unavailable."));
  }, []);

  useEffect(() => {
    if (!token || !ref.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/light-v11",
      center,
      zoom,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center, zoom, duration: 800 });
  }, [center[0], center[1], zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pins: mapboxgl.Marker[] = [];
    const bounds = new mapboxgl.LngLatBounds();
    let valid = 0;
    markers.forEach((m) => {
      if (typeof m.lat !== "number" || typeof m.lng !== "number") return;
      const el = document.createElement("button");
      const color = m.region === "africa" ? "#16a34a" : "#2563eb";
      el.style.backgroundColor = color;
      el.className = "text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg border-2 border-background cursor-pointer hover:scale-110 transition-transform";
      el.textContent = m.price_usd ? `$${Math.round(m.price_usd / 1000)}k` : "•";
      if (onMarkerClick) el.addEventListener("click", () => onMarkerClick(m.id));
      const pin = new mapboxgl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
      if (m.title) pin.setPopup(new mapboxgl.Popup({ offset: 16 }).setText(m.title));
      pins.push(pin);
      bounds.extend([m.lng, m.lat]);
      valid++;
    });
    if ((autoFit || fitBoundsOnLoad) && valid > 1) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 11, duration: autoFit ? 600 : 0 });
    } else if ((autoFit || fitBoundsOnLoad) && valid === 1) {
      const first = markers.find((m) => typeof m.lat === "number" && typeof m.lng === "number")!;
      map.flyTo({ center: [first.lng, first.lat], zoom: 11, duration: autoFit ? 600 : 0 });
    }
    return () => pins.forEach((p) => p.remove());
  }, [markers, onMarkerClick, autoFit]);

  if (err) return <div style={{ height }} className="rounded-2xl bg-muted flex items-center justify-center text-sm text-muted-foreground">{err}</div>;

  const isEmpty = markers.filter((m) => typeof m.lat === "number" && typeof m.lng === "number").length === 0;

  return (
    <div className="relative">
      <div ref={ref} style={{ height }} className="rounded-2xl overflow-hidden border border-border" />
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-xl px-5 py-4 shadow-lg text-center max-w-xs pointer-events-auto">
            <div className="text-2xl mb-1">🗺️</div>
            <p className="text-sm font-medium text-foreground">{emptyMessage ?? "No properties match your filters"}</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search criteria</p>
          </div>
        </div>
      )}
    </div>
  );
}
