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
}

export function MapView({ markers = [], center = [-84.3880, 33.7490], zoom = 10, height = "420px", onMarkerClick, fitBoundsOnLoad = false }: Props) {
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
    if (!map || !markers.length) return;
    const pins: mapboxgl.Marker[] = [];
    const bounds = new mapboxgl.LngLatBounds();
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
    });
    if (fitBoundsOnLoad && pins.length > 1) map.fitBounds(bounds, { padding: 60, maxZoom: 10, duration: 0 });
    else if (fitBoundsOnLoad && pins.length === 1) map.flyTo({ center: [markers[0].lng, markers[0].lat], zoom: 11, duration: 0 });
    return () => pins.forEach((p) => p.remove());
  }, [markers, onMarkerClick]);

  if (err) return <div style={{ height }} className="rounded-2xl bg-muted flex items-center justify-center text-sm text-muted-foreground">{err}</div>;

  return <div ref={ref} style={{ height }} className="rounded-2xl overflow-hidden border border-border" />;
}
