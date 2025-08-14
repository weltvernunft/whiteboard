// features/board/core/CanvasAdapter.ts
import { useEffect, useRef } from "react";
import { Canvas } from "fabric";

export function useCanvas(
  canvasElRef: React.MutableRefObject<HTMLCanvasElement | null>
) {
  const fabricRef = useRef<Canvas | null>(null);

  useEffect(() => {
    const el = canvasElRef.current;
    if (!el) return;

    const f = new Canvas(el, {
      // твои опции для fabric.Canvas
    });
    fabricRef.current = f;

    return () => {
      f.dispose();
      fabricRef.current = null;
    };
  }, [canvasElRef]);

  return fabricRef; // React.MutableRefObject<Canvas | null>
}
