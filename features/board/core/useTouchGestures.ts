// features/board/core/useTouchGestures.ts
import { useEffect } from "react";
import type { Canvas } from "fabric";
import { Point } from "fabric";
import { util } from "fabric";
import { CONFIG } from "../core/Defaults";
import { clamp, updateCanvasTransform } from "../core/utils/canvasUtils";

type FabricRef = React.MutableRefObject<Canvas | null>;
type WrapRef = React.RefObject<HTMLDivElement | null>;

type PresenceFn = (p: {
  cursor: { x: number; y: number } | null;
  lastSeen: number;
}) => void;

/**
 * Тач-пан и пинч-зум. Точная preventDefault, без глобальных заглушек.
 */
export function useTouchGestures(
  fabricRef: FabricRef,
  wrapRef: WrapRef,
  sendPresence: PresenceFn
) {
  useEffect(() => {
    const f = fabricRef.current;
    const wrap = wrapRef.current;
    if (!f || !wrap) return;

    type TP = { x: number; y: number };
    const dist = (a: TP, b: TP) => Math.hypot(a.x - b.x, a.y - b.y);
    const mid = (a: TP, b: TP) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    let tMode: "none" | "pan" | "pinch" = "none";
    let tLast: TP | null = null;
    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    let pinchCenter: TP = { x: 0, y: 0 };

    const getTouches = (ev: TouchEvent): TP[] => {
      const rect = f.upperCanvasEl.getBoundingClientRect();
      return Array.from(ev.touches).map((t) => ({
        x: t.clientX - rect.left,
        y: t.clientY - rect.top,
      }));
    };

    const handlePan = (pts: TP[]) => {
      if (!tLast) return;
      const p = pts[0];
      const vpt = f.viewportTransform!;
      vpt[4] += p.x - tLast.x;
      vpt[5] += p.y - tLast.y;
      tLast = p;
      updateCanvasTransform(f, vpt, wrapRef); // сигнатура как в твоём коде
      sendPresence({ cursor: { x: p.x, y: p.y }, lastSeen: Date.now() });
    };

    const handlePinch = (pts: TP[]) => {
      const d = dist(pts[0], pts[1]);
      let scale = (pinchStartZoom * d) / Math.max(10, pinchStartDist);
      scale = clamp(scale, CONFIG.MIN_ZOOM, CONFIG.MAX_ZOOM);
      scale = clamp(
        scale,
        f.getZoom() / CONFIG.MAX_ZOOM_STEP,
        f.getZoom() * CONFIG.MAX_ZOOM_STEP
      );
      f.zoomToPoint(new Point(pinchCenter.x, pinchCenter.y), scale);
      updateCanvasTransform(f, f.viewportTransform!, wrapRef);
      sendPresence({ cursor: null, lastSeen: Date.now() });
    };

    const onTouchStart = (ev: TouchEvent) => {
      ev.preventDefault();
      const pts = getTouches(ev);
      if (pts.length === 1) {
        tMode = "pan";
        tLast = pts[0];
      } else if (pts.length >= 2) {
        tMode = "pinch";
        pinchStartDist = dist(pts[0], pts[1]);
        pinchStartZoom = f.getZoom();
        pinchCenter = mid(pts[0], pts[1]);
      }
    };

    const onTouchMove = (ev: TouchEvent) => {
      ev.preventDefault();
      const pts = getTouches(ev);
      if (tMode === "pan" && pts.length === 1) handlePan(pts);
      else if (tMode === "pinch" && pts.length >= 2) handlePinch(pts);
    };

    const onTouchEnd = (ev: TouchEvent) => {
      ev.preventDefault();
      if (ev.touches.length === 0) {
        tMode = "none";
        tLast = null;
      } else if (ev.touches.length === 1) {
        tMode = "pan";
        tLast = getTouches(ev)[0] ?? null;
      }
    };

    wrap.addEventListener("touchstart", onTouchStart, { passive: false });
    wrap.addEventListener("touchmove", onTouchMove, { passive: false });
    wrap.addEventListener("touchend", onTouchEnd, { passive: false });
    wrap.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      wrap.removeEventListener("touchstart", onTouchStart);
      wrap.removeEventListener("touchmove", onTouchMove);
      wrap.removeEventListener("touchend", onTouchEnd);
      wrap.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [fabricRef, wrapRef, sendPresence]);
}
