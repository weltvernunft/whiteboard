"use client";
import { useEffect, useRef, useCallback } from "react";
import { useMyPresence } from "../collab/liveblocks";
import { throttle } from "lodash";
import { CONFIG } from "../core/Defaults";
import { useCanvas } from "../core/CanvasAdapter";
import { useSelectTool } from "../tools/SelectTool";
import { usePenTool } from "../tools/PenTool";
import { useHighlighterTool } from "../tools/HighlighterTool";
import { useCanvasKeyboard } from "../core/useCanvasKeyboard";
import { usePresenceCursor } from "../collab/usePresenceCursor";
import { useSpacePan } from "../core/useSpacePan";
import { useWheelZoomPan } from "../core/useWheelZoomPan";
import { useCanvasResize } from "../core/useCanvasResize";
import { useTouchGestures } from "../core/useTouchGestures";

export default function CanvasView() {
  const [{ tool }, updatePresence] = useMyPresence();

  // Тут мы создаем "обезжиренную" функцию, которую и будем использовать
  const throttledUpdatePresence = useCallback(
    throttle(updatePresence, 100, { leading: true, trailing: true }),
    [updatePresence]
  );

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);

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
  useWheelZoomPan(fabricRef, wrapRef);
  useCanvasResize(fabricRef, wrapRef);
  useTouchGestures(fabricRef, wrapRef, throttledUpdatePresence); // ← новый

  useCanvasKeyboard(fabricRef, handleUpdatePresence);
  useSpacePan(fabricRef, tool, wrapRef);

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
  }, [throttledUpdatePresence]);

  useEffect(() => {
    // зеркалим текущий инструмент в presence — без курсора
    throttledUpdatePresence({ tool, lastSeen: Date.now() } as any);
  }, [tool, throttledUpdatePresence]);

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
