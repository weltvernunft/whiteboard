import { useEffect, useRef } from "react";
import { Canvas } from "fabric";

export function useCanvas(canvasElRef: React.RefObject<HTMLCanvasElement>) {
  const fabricRef = useRef<Canvas | null>(null);

  useEffect(() => {
    if (!canvasElRef.current) return;

    const f = new Canvas(canvasElRef.current, {
      selection: true,
      preserveObjectStacking: true,
    });
    fabricRef.current = f;

    return () => {
      f.dispose();
      fabricRef.current = null;
    };
  }, [canvasElRef]);

  return fabricRef;
}
