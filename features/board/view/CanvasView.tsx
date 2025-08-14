"use client";
import { useEffect, useRef, useCallback } from "react";
import { Canvas, PencilBrush, Point, util } from "fabric";
import { useMyPresence } from "../collab/liveblocks";
import { throttle } from "lodash";
import { CONFIG, CURSORS } from "../core/Defaults";
import { useCanvas } from "../core/CanvasAdapter";
import { useSelectTool } from "../tools/SelectTool";
import { usePenTool } from "../tools/PenTool";
import { useHighlighterTool } from "../tools/HighlighterTool";
import { useCanvasKeyboard } from "../core/useCanvasKeyboard";
// Импортируем нашу новую утилиту
import { updateCanvasTransform, clamp } from "../core/utils/canvasUtils";
import { usePresenceCursor } from "../collab/usePresenceCursor";

export default function CanvasView() {
  const [{ tool }, updatePresence] = useMyPresence();

  // Тут мы создаем "обезжиренную" функцию, которую и будем использовать
  const throttledUpdatePresence = useCallback(
    throttle(updatePresence, 100, { leading: true, trailing: true }),
    [updatePresence]
  );

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(
    null
  ) as React.RefObject<HTMLCanvasElement>;
  const fabricRef = useCanvas(canvasElRef);
  usePresenceCursor(fabricRef, throttledUpdatePresence);
  const handleUpdatePresence = useCallback(
    (presence: { tool: string; lastSeen: number }) => {
      throttledUpdatePresence(presence as any);
    },
    [throttledUpdatePresence]
  );

  // Подключаем хуки инструментов и клавиатуры
  useSelectTool(fabricRef, tool);
  usePenTool(fabricRef, tool);
  useHighlighterTool(fabricRef, tool);
  // Передаём в хук нашу новую, "правильную" функцию
  useCanvasKeyboard(fabricRef, handleUpdatePresence);

  // === Здесь раньше были clamp и updateCanvasTransform, теперь их нет! ===

  // Предотвращение стандартных событий
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const prevent = (e: Event) => e.preventDefault();

    wrap.addEventListener("wheel", prevent, { passive: false });
    wrap.addEventListener("touchmove", prevent, { passive: false });
    wrap.addEventListener("gesturestart", prevent as any, { passive: false });
    wrap.addEventListener("gesturechange", prevent as any, { passive: false });
    wrap.addEventListener("gestureend", prevent as any, { passive: false });

    return () => {
      wrap.removeEventListener("wheel", prevent);
      wrap.removeEventListener("touchmove", prevent);
      wrap.removeEventListener("gesturestart", prevent as any);
      wrap.removeEventListener("gesturechange", prevent as any);
      wrap.removeEventListener("gestureend", prevent as any);
    };
  }, []);

  // Управление канвасом
  useEffect(() => {
    const f = fabricRef.current;
    const wrap = wrapRef.current;
    if (!f || !wrap) return;

    // Начальное presence
    throttledUpdatePresence({
      cursor: null,
      lastSeen: Date.now(),
    });

    // === Колёсико ===
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
        updateCanvasTransform(f, vpt, wrapRef); // <-- Обновленный вызов
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
      updateCanvasTransform(f, vpt, wrapRef); // <-- Обновленный вызов
    };
    wrap.addEventListener("wheel", onWheel, { passive: false });

    // === Панорамирование Space ===
    let panning = false;
    let last = { x: 0, y: 0 };
    let prevSelection = true;

    const isTypingEl = (el: EventTarget | null) =>
      !!el &&
      el instanceof HTMLElement &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable);

    const setCursor = (isGrabbing = false) => {
      f.setCursor(isGrabbing ? CURSORS.panning : CURSORS.pan);
    };

    const onKeyDownSpace = (ev: KeyboardEvent) => {
      if (ev.code !== "Space" || ev.repeat) return;
      if (isTypingEl(ev.target)) return;

      ev.preventDefault();
      panning = true;
      prevSelection = f.selection;
      f.selection = false;
      f.discardActiveObject();
      setCursor(false);
    };

    const onKeyUpSpace = (ev: KeyboardEvent) => {
      if (ev.code !== "Space") return;
      panning = false;
      f.selection = prevSelection;
      f.setCursor(CURSORS[tool] || CURSORS.select);
    };

    window.addEventListener("keydown", onKeyDownSpace, { capture: true });
    window.addEventListener("keyup", onKeyUpSpace, { capture: true });

    f.on("mouse:down", (opt) => {
      if (!panning) return;
      setCursor(true);
      last = util.getPointer(opt.e as MouseEvent);
    });

    f.on("mouse:move", (opt) => {
      if (!panning) return;
      const p = util.getPointer(opt.e as MouseEvent);
      const vpt = f.viewportTransform!;
      vpt[4] += p.x - last.x;
      vpt[5] += p.y - last.y;
      last = p;
      updateCanvasTransform(f, vpt, wrapRef); // <-- Обновленный вызов
    });

    f.on("mouse:up", () => {
      if (panning) setCursor(false);
    });

    // === Touch ===
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

    const handlePan = (pts: TP[], f: Canvas) => {
      if (!tLast) return;
      const p = pts[0];
      const vpt = f.viewportTransform!;
      vpt[4] += p.x - tLast.x;
      vpt[5] += p.y - tLast.y;
      tLast = p;
      updateCanvasTransform(f, vpt, wrapRef); // <-- Обновленный вызов
      throttledUpdatePresence({
        cursor: { x: p.x, y: p.y },
        lastSeen: Date.now(),
      });
    };

    const handlePinch = (pts: TP[], f: Canvas) => {
      const d = dist(pts[0], pts[1]);
      let scale = (pinchStartZoom * d) / Math.max(10, pinchStartDist);
      scale = clamp(scale, CONFIG.MIN_ZOOM, CONFIG.MAX_ZOOM);
      scale = clamp(
        scale,
        f.getZoom() / CONFIG.MAX_ZOOM_STEP,
        f.getZoom() * CONFIG.MAX_ZOOM_STEP
      );
      f.zoomToPoint(new Point(pinchCenter.x, pinchCenter.y), scale);
      updateCanvasTransform(f, f.viewportTransform!, wrapRef); // <-- Обновленный вызов
      throttledUpdatePresence({ cursor: null, lastSeen: Date.now() });
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
      if (tMode === "pan" && pts.length === 1) handlePan(pts, f);
      else if (tMode === "pinch" && pts.length >= 2) handlePinch(pts, f);
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

    // === Resize ===
    const fit = () => {
      const f = fabricRef.current;
      if (!f) return;
      const r = wrap.getBoundingClientRect();
      f.setWidth(r.width);
      f.setHeight(r.height);
      updateCanvasTransform(f, f.viewportTransform!, wrapRef); // <-- Обновленный вызов
    };
    requestAnimationFrame(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

    return () => {
      ro.disconnect();
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("touchstart", onTouchStart);
      wrap.removeEventListener("touchmove", onTouchMove);
      wrap.removeEventListener("touchend", onTouchEnd);
      wrap.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKeyDownSpace, { capture: true });
      window.removeEventListener("keyup", onKeyUpSpace, { capture: true });
    };
  }, [throttledUpdatePresence, handleUpdatePresence, tool, wrapRef]);

  return (
    <div
      ref={wrapRef}
      className="w-full h-full touch-none overscroll-contain"
      style={{
        backgroundImage:
          "radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)",
        backgroundRepeat: "repeat",
        backgroundSize: `${CONFIG.GRID_BASE}px ${CONFIG.GRID_BASE}px`,
        backgroundPosition: "0 0",
      }}
    >
      <canvas ref={canvasElRef} className="block w-full h-full" />
    </div>
  );
}
