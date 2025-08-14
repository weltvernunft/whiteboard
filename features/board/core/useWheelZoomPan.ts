import { useEffect } from "react";
import type { Canvas } from "fabric";
import { Point, util } from "fabric";
import { CONFIG } from "../core/Defaults"; // если файл лежит не в core — поправь путь
import { clamp, updateCanvasTransform } from "../core/utils/canvasUtils";

type FabricRef = React.MutableRefObject<Canvas | null>;
type WrapRef = React.RefObject<HTMLDivElement | null>;

export function useWheelZoomPan(fabricRef: FabricRef, wrapRef: WrapRef) {
  useEffect(() => {
    const f = fabricRef.current;
    const wrap = wrapRef.current;
    if (!f || !wrap) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const vpt = f.viewportTransform!;
      const rect = f.upperCanvasEl.getBoundingClientRect();
      const p = util.getPointer(e);

      if (e.ctrlKey || e.metaKey) {
        let factor = Math.exp(-e.deltaY * CONFIG.SCALE_PER_PIXEL);
        factor = clamp(factor, 1 / CONFIG.MAX_ZOOM_STEP, CONFIG.MAX_ZOOM_STEP);
        const next = clamp(
          f.getZoom() * factor,
          CONFIG.MIN_ZOOM,
          CONFIG.MAX_ZOOM
        );
        f.zoomToPoint(new Point(p.x - rect.left, p.y - rect.top), next);
        updateCanvasTransform(f, vpt, wrapRef); // оставляем старую сигнатуру
        return;
      }

      const stepX = clamp(
        (e.shiftKey ? e.deltaY : e.deltaX) * CONFIG.PAN_FACTOR,
        -CONFIG.PAN_MAX_PER_TICK,
        CONFIG.PAN_MAX_PER_TICK
      );
      const stepY = clamp(
        (e.shiftKey ? 0 : e.deltaY) * CONFIG.PAN_FACTOR,
        -CONFIG.PAN_MAX_PER_TICK,
        CONFIG.PAN_MAX_PER_TICK
      );
      vpt[4] -= stepX;
      vpt[5] -= stepY;
      updateCanvasTransform(f, vpt, wrapRef);
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      wrap.removeEventListener("wheel", onWheel);
    };
  }, [fabricRef, wrapRef]);
}
