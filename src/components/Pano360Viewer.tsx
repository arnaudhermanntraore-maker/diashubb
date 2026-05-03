import { useEffect, useRef, useState } from "react";
import { Loader2, Maximize2, RotateCcw } from "lucide-react";

declare global {
  interface Window {
    pannellum?: {
      viewer: (
        id: string | HTMLElement,
        config: Record<string, unknown>,
      ) => {
        destroy: () => void;
        setPitch: (n: number) => void;
        setYaw: (n: number) => void;
        setHfov: (n: number) => void;
      };
    };
  }
}

const PANNELLUM_JS = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
const PANNELLUM_CSS = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";

let loadPromise: Promise<void> | null = null;

function loadPannellum(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.pannellum) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${PANNELLUM_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = PANNELLUM_CSS;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = PANNELLUM_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Échec du chargement du viewer 360°"));
    document.head.appendChild(script);
  });
  return loadPromise;
}

interface Props {
  imageUrl: string;
  height?: number;
  className?: string;
}

export function Pano360Viewer({ imageUrl, height = 320, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ReturnType<NonNullable<Window["pannellum"]>["viewer"]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadPannellum()
      .then(() => {
        if (cancelled || !containerRef.current || !window.pannellum) return;
        try {
          viewerRef.current?.destroy();
          viewerRef.current = window.pannellum.viewer(containerRef.current, {
            type: "equirectangular",
            panorama: imageUrl,
            autoLoad: true,
            showControls: false,
            showZoomCtrl: false,
            showFullscreenCtrl: false,
            mouseZoom: true,
            draggable: true,
            hfov: 100,
            minHfov: 50,
            maxHfov: 120,
            crossOrigin: "anonymous",
          });
          setLoading(false);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Erreur viewer");
          setLoading(false);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Erreur");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      try { viewerRef.current?.destroy(); } catch { /* noop */ }
      viewerRef.current = null;
    };
  }, [imageUrl]);

  const reset = () => {
    if (!viewerRef.current) return;
    viewerRef.current.setPitch(0);
    viewerRef.current.setYaw(0);
    viewerRef.current.setHfov(100);
  };

  const fullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div className={`relative rounded-lg overflow-hidden bg-black/90 ${className ?? ""}`} style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Chargement du panorama…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-white/90 text-sm">
          {error}
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button type="button" onClick={reset} title="Recentrer" className="w-8 h-8 rounded-md bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur">
              <RotateCcw size={14} />
            </button>
            <button type="button" onClick={fullscreen} title="Plein écran" className="w-8 h-8 rounded-md bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur">
              <Maximize2 size={14} />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-[10px] uppercase tracking-wider backdrop-blur">
            360° · Glissez · Molette pour zoomer
          </div>
        </>
      )}
    </div>
  );
}
