import { useEffect } from "react";
import { Canvas } from "fabric";
import { CURSORS } from "../core/Defaults";

export function useSelectTool(
  fabricRef: React.RefObject<Canvas | null>,
  tool: string
) {
  useEffect(() => {
    const f = fabricRef.current;
    if (!f || tool !== "select") return;

    // Настраиваем селект-тул, но не сбрасываем активный объект, если он уже есть
    f.isDrawingMode = false;
    f.selection = true;
    f.defaultCursor = CURSORS.select;
    // Удаляем discardActiveObject, чтобы не сбрасывать выделение
    f.requestRenderAll();
  }, [fabricRef, tool]);
}
