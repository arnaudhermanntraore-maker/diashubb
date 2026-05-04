import { useEffect, useState, useCallback, useRef, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface Props {
  photos: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  alt?: string;
}

export function PhotoLightbox({ photos, index, onClose, onIndexChange, alt = "" }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const reset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  const prev = useCallback(() => { onIndexChange((index - 1 + photos.length) % photos.length); reset(); }, [index, photos.length, onIndexChange, reset]);
  const next = useCallback(() => { onIndexChange((index + 1) % photos.length); reset(); }, [index, photos.length, onIndexChange, reset]);

  // Save focus, autofocus close button, restore on unmount
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowLeft") { prev(); return; }
      if (e.key === "ArrowRight") { next(); return; }
      if (e.key === "+" || e.key === "=") { setZoom((z) => Math.min(5, z + 0.5)); return; }
      if (e.key === "-") { setZoom((z) => Math.max(1, z - 0.5)); return; }
      if (e.key === "0") { reset(); return; }

      // Focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, prev, next, reset]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(1, Math.min(5, z + (e.deltaY < 0 ? 0.25 : -0.25))));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setPan({ x: dragRef.current.px + (e.clientX - dragRef.current.x), y: dragRef.current.py + (e.clientY - dragRef.current.y) });
  };
  const onMouseUp = () => { dragRef.current = null; };

  const photo = photos[index];

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `Photo gallery — ${alt}` : "Photo gallery"}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <h2 id="lightbox-title" className="sr-only">{alt ? `Photo gallery — ${alt}` : "Photo gallery"}</h2>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Photo {index + 1} of {photos.length}
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="text-sm opacity-80" aria-hidden="true">{index + 1} / {photos.length}</div>
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => setZoom((z) => Math.max(1, z - 0.5))} aria-label="Zoom out"><ZoomOut className="w-5 h-5" /></IconBtn>
          <span className="text-xs w-12 text-center tabular-nums" aria-label={`Zoom level ${Math.round(zoom * 100)} percent`}>{Math.round(zoom * 100)}%</span>
          <IconBtn onClick={() => setZoom((z) => Math.min(5, z + 0.5))} aria-label="Zoom in"><ZoomIn className="w-5 h-5" /></IconBtn>
          <IconBtn onClick={reset} aria-label="Reset zoom and position"><RotateCcw className="w-5 h-5" /></IconBtn>
          <IconBtn ref={closeBtnRef} onClick={onClose} aria-label="Close gallery (Escape)"><X className="w-5 h-5" /></IconBtn>
        </div>
      </div>

      {/* Image area */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center select-none"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <img
          src={photo}
          alt={alt}
          draggable={false}
          onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2))}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? (dragRef.current ? "grabbing" : "grab") : "zoom-in",
            transition: dragRef.current ? "none" : "transform 0.15s ease-out",
            maxHeight: "90vh",
            maxWidth: "95vw",
          }}
          className="object-contain"
        />

        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label={`Previous photo (${((index - 1 + photos.length) % photos.length) + 1} of ${photos.length})`}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white text-white flex items-center justify-center backdrop-blur"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden="true" />
            </button>
            <button
              onClick={next}
              aria-label={`Next photo (${((index + 1) % photos.length) + 1} of ${photos.length})`}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white text-white flex items-center justify-center backdrop-blur"
            >
              <ChevronRight className="w-6 h-6" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Thumbs */}
      {photos.length > 1 && (
        <div className="px-4 py-3 flex gap-2 overflow-x-auto justify-center" role="tablist" aria-label="Photo thumbnails">
          {photos.map((p, i) => (
            <button key={i} onClick={() => { onIndexChange(i); reset(); }}
              role="tab"
              aria-selected={i === index}
              aria-label={`Show photo ${i + 1} of ${photos.length}`}
              className={`shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition focus:outline-none focus:ring-2 focus:ring-white ${i === index ? "border-red-500" : "border-transparent opacity-60 hover:opacity-100"}`}>
              <img src={p} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="text-center text-[11px] text-white/50 pb-2" aria-hidden="true">
        ← → navigate · +/− zoom · 0 reset · Esc close
      </div>
    </div>
  );
}

const IconBtn = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function IconBtn({ children, className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        {...rest}
        className={`w-9 h-9 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white flex items-center justify-center transition ${className ?? ""}`}
      >
        {children}
      </button>
    );
  }
);
