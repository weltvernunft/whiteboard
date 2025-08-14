import { useEffect } from "react";
import { Canvas, PencilBrush } from "fabric";
import { CONFIG, CURSORS } from "../core/Defaults";

export function useHighlighterTool(
  fabricRef: React.RefObject<Canvas | null>,
  tool: string
) {
  useEffect(() => {
    const f = fabricRef.current;
    if (!f || tool !== "hl") return;

    const cacheKey = "__brushes";
    const store =
      (f as any)[cacheKey] ||
      ((f as any)[cacheKey] = {} as Record<string, PencilBrush>);
    let brush = store[tool];

    if (!brush) {
      brush = new PencilBrush(f);
      brush.decimate = 1.5;
      brush.strokeLineCap = "round";
      brush.strokeLineJoin = "round";
      store[tool] = brush;
    }

    brush.width = CONFIG.BRUSH_WIDTH.hl;
    brush.color = CONFIG.BRUSH_COLOR.hl;

    // ВОТ ОНА, ТВОЯ МАГИЯ!
    brush.globalCompositeOperation = "multiply";

    f.isDrawingMode = true;
    f.freeDrawingBrush = brush;
    f.selection = false;
    f.defaultCursor = CURSORS.hl;
    f.requestRenderAll();

    // Не забудь сбросить режим при смене инструмента
    return () => {
      if (f) {
        // Сбрасываем на стандартный режим, если он был изменен
        if (f.freeDrawingBrush) {
          (f.freeDrawingBrush as any).globalCompositeOperation = "source-over";
        }
      }
    };
  }, [fabricRef, tool]);
}
