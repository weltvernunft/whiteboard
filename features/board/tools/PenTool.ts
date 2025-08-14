import { useEffect } from "react";
import { Canvas, PencilBrush } from "fabric";
import { CONFIG, CURSORS } from "../core/Defaults";

export function usePenTool(
  fabricRef: React.RefObject<Canvas | null>,
  tool: string
) {
  useEffect(() => {
    const f = fabricRef.current;
    if (!f || tool !== "pen") return; // Активируем только для pen

    // Кеш кистей на инстансе канваса
    const cacheKey = "__brushes";
    const store =
      (f as any)[cacheKey] ||
      ((f as any)[cacheKey] = {} as Record<string, PencilBrush>);
    let brush = store[tool];

    if (!brush) {
      brush = new PencilBrush(f);
      brush.decimate = 2; // Сглаживание траектории для оптимизации
      brush.strokeLineCap = "round";
      brush.strokeLineJoin = "round";
      store[tool] = brush;
    }

    brush.width = CONFIG.BRUSH_WIDTH.pen;
    brush.color = CONFIG.BRUSH_COLOR.pen;
    f.isDrawingMode = true;
    f.freeDrawingBrush = brush;
    f.selection = false;
    f.defaultCursor = CURSORS.pen;
    f.requestRenderAll();
  }, [fabricRef, tool]);
}
