import { useEffect } from "react";
import { Canvas, ActiveSelection } from "fabric";
import { CURSORS } from "./Defaults";

export function useCanvasKeyboard(
  fabricRef: React.RefObject<Canvas | null>,
  throttledUpdatePresence: (presence: {
    tool: string;
    lastSeen: number;
  }) => void
) {
  useEffect(() => {
    const onKeyDownEdit = (ev: KeyboardEvent) => {
      // пропускаем Ctrl/⌘+V, иначе paste-ивент не прилетит
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "v") return;

      const target = ev.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const f = fabricRef.current;
      if (!f) return;

      if (
        !isTyping &&
        (ev.metaKey || ev.ctrlKey) &&
        ev.key.toLowerCase() === "a"
      ) {
        ev.preventDefault();
        f.isDrawingMode = false;
        (f as any).selection = true;
        f.setCursor(CURSORS.select);

        const objects = f.getObjects();
        if (objects.length > 0) {
          const selection = new ActiveSelection(objects, { canvas: f });
          f.setActiveObject(selection);
        } else {
          f.discardActiveObject();
        }
        f.requestRenderAll();
        throttledUpdatePresence({ tool: "select", lastSeen: Date.now() });
      }

      if (!isTyping && (ev.key === "Delete" || ev.key === "Backspace")) {
        const active = f.getActiveObject();
        if (active) {
          ev.preventDefault();
          if (active instanceof ActiveSelection) {
            active.forEachObject((obj) => f.remove(obj));
            f.discardActiveObject();
          } else {
            f.remove(active);
          }
          f.requestRenderAll();
        }
      }

      if (ev.key === "Escape") {
        const active = f.getActiveObject();
        if (active) {
          ev.preventDefault();
          f.discardActiveObject();
          f.requestRenderAll();
        }
      }
    };

    // БЕЗ capture
    window.addEventListener("keydown", onKeyDownEdit);
    return () => window.removeEventListener("keydown", onKeyDownEdit);
  }, [fabricRef, throttledUpdatePresence]);
}
