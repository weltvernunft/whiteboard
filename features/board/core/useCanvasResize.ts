// features/board/core/useCanvasResize.ts
import { useEffect } from "react";
import type { Canvas } from "fabric";
import { updateCanvasTransform } from "./utils/canvasUtils";

type FabricRef = React.MutableRefObject<Canvas | null>;
type WrapRef = React.RefObject<HTMLDivElement | null>;

export function useCanvasResize(fabricRef: FabricRef, wrapRef: WrapRef) {
  useEffect(() => {
    const f = fabricRef.current;
    const wrap = wrapRef.current;
    if (!f || !wrap) return;

    const fit = () => {
      const canvas = fabricRef.current;
      const el = wrapRef.current;
      if (!canvas || !el) return;

      const r = el.getBoundingClientRect();
      canvas.setWidth(r.width);
      canvas.setHeight(r.height);
      updateCanvasTransform(canvas, canvas.viewportTransform!, wrapRef); // оставляем твою сигнатуру
    };

    // первый замер
    requestAnimationFrame(fit);

    const ro = new ResizeObserver(() => fit());
    ro.observe(wrap);

    return () => {
      ro.disconnect();
    };
  }, [fabricRef, wrapRef]);
}
